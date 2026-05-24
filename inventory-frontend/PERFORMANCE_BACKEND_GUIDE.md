# Backend Performance Implementation Guide

This frontend workspace does not include the Spring Boot backend repo, so these are the backend changes to apply there.

## Spring Cache With Redis

Use Redis on Render for shared production cache and Caffeine/in-memory only for local development.

```java
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(5))
            .disableCachingNullValues()
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer())
            );

        Map<String, RedisCacheConfiguration> configs = Map.of(
            "products", defaults.entryTtl(Duration.ofMinutes(2)),
            "dashboard", defaults.entryTtl(Duration.ofMinutes(1)),
            "categories", defaults.entryTtl(Duration.ofHours(1)),
            "suppliers", defaults.entryTtl(Duration.ofMinutes(10)),
            "inventoryLogs", defaults.entryTtl(Duration.ofMinutes(1))
        );

        return RedisCacheManager.builder(factory)
            .cacheDefaults(defaults)
            .withInitialCacheConfigurations(configs)
            .transactionAware()
            .build();
    }
}
```

## Cache Hot Reads

Cache list endpoints, detail endpoints, low stock, dashboard summary, categories, suppliers, and inventory log pages. Do not cache `/api/auth/login`, `/api/auth/refresh`, or role-sensitive auth decisions.

```java
@Cacheable(cacheNames = "products", key = "'all:' + #pageable.pageNumber + ':' + #pageable.pageSize + ':' + (#search ?: '')")
public Page<ProductResponse> getProducts(Pageable pageable, String search) {
    return productRepository.searchProducts(search, pageable).map(productMapper::toResponse);
}

@Cacheable(cacheNames = "dashboard", key = "'summary'")
public DashboardSummary getDashboardSummary() {
    return dashboardRepository.getSummary();
}

@Cacheable(cacheNames = "categories", key = "'all'")
public List<CategoryResponse> getCategories() {
    return categoryRepository.findAllByOrderByNameAsc().stream().map(mapper::toResponse).toList();
}
```

## Invalidate On Writes

Every create, update, delete, stock adjustment, supplier assignment, sale checkout, refund, and inventory log write should evict affected caches.

```java
@Caching(evict = {
    @CacheEvict(cacheNames = "products", allEntries = true),
    @CacheEvict(cacheNames = "dashboard", allEntries = true),
    @CacheEvict(cacheNames = "inventoryLogs", allEntries = true)
})
@Transactional
public ProductResponse updateStock(Long productId, int quantity) {
    Product product = productRepository.findByIdForUpdate(productId)
        .orElseThrow(() -> new NotFoundException("Product not found"));
    product.setStockQuantity(quantity);
    inventoryLogService.recordAdjustment(product, quantity);
    return productMapper.toResponse(product);
}
```

## JPA Query Optimizations

Avoid N+1 queries with entity graphs or fetch joins on read paths that need category/supplier data.

```java
@EntityGraph(attributePaths = {"category", "productSuppliers", "productSuppliers.supplier"})
@Query("""
    select p from Product p
    where (:search is null or lower(p.name) like lower(concat('%', :search, '%'))
       or lower(p.sku) like lower(concat('%', :search, '%')))
""")
Page<Product> searchProducts(@Param("search") String search, Pageable pageable);
```

Use projections for dashboard analytics instead of loading full entities.

```java
@Query("""
    select new com.example.dashboard.DashboardSummaryDto(
        coalesce(sum(s.totalPrice), 0),
        count(s),
        (select count(l) from InventoryLog l),
        (select count(p) from Product p where p.stockQuantity <= p.minimumStock)
    )
    from Sale s
    where s.status <> 'CANCELLED'
""")
DashboardSummaryDto getSummary();
```

## PostgreSQL Index Recommendations

Run these after checking actual table/column names.

```sql
create index if not exists idx_products_name_lower on products (lower(name));
create index if not exists idx_products_sku_lower on products (lower(sku));
create index if not exists idx_products_category_id on products (category_id);
create index if not exists idx_products_low_stock on products (stock_quantity, minimum_stock);
create index if not exists idx_inventory_logs_product_created on inventory_logs (product_id, created_at desc);
create index if not exists idx_inventory_logs_type_created on inventory_logs (type, created_at desc);
create index if not exists idx_sales_created_status on sales (created_at desc, status);
create index if not exists idx_sales_user_created on sales (user_id, created_at desc);
create index if not exists idx_suppliers_name_lower on suppliers (lower(name));
```

For fuzzy search at scale, enable trigram search:

```sql
create extension if not exists pg_trgm;
create index if not exists idx_products_name_trgm on products using gin (name gin_trgm_ops);
create index if not exists idx_products_sku_trgm on products using gin (sku gin_trgm_ops);
```

## Spring Boot Performance Settings

```properties
server.compression.enabled=true
server.compression.mime-types=application/json,text/html,text/xml,text/plain,text/css,text/javascript,application/javascript
server.compression.min-response-size=1024

spring.jpa.open-in-view=false
spring.jpa.properties.hibernate.default_batch_fetch_size=50
spring.jpa.properties.hibernate.jdbc.batch_size=50
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true

spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000

spring.data.redis.timeout=2s
spring.cache.redis.time-to-live=5m
```

## Async Work

Use async processing for non-critical work after write transactions: audit logs, notifications, reports, and cache warmups. Do not make inventory stock mutation itself async because it must stay transactionally consistent.

```java
@Async
public CompletableFuture<Void> warmDashboardCache() {
    dashboardService.getDashboardSummary();
    return CompletableFuture.completedFuture(null);
}
```

## JWT Safety

Keep auth endpoints uncached at HTTP/CDN level. Only cache user profile lookups briefly per authenticated request context, and always rely on server-side role checks for protected operations.
