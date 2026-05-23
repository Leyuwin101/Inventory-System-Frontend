export const unwrapApiData = (responseData) => responseData?.data ?? responseData;

export const asArray = (value) => {
    const data = unwrapApiData(value);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(data?.categories)) return data.categories;
    if (Array.isArray(data?.suppliers)) return data.suppliers;
    if (Array.isArray(data?.sales)) return data.sales;
    if (Array.isArray(data?.logs)) return data.logs;
    return [];
};

export const normalizeCategory = (category = {}) => ({
    ...category,
    id: category.id ?? category.categoryID ?? category.categoryId ?? category.category_id,
    category_id: category.category_id ?? category.categoryID ?? category.categoryId ?? category.id,
    categoryId: category.categoryId ?? category.categoryID ?? category.category_id ?? category.id,
    name: category.name ?? "",
    description: category.description ?? "",
});

export const normalizeProductSupplier = (supplier = {}) => ({
    ...supplier,
    id: supplier.id ?? supplier.supplierID ?? supplier.supplierId ?? supplier.supplier_id,
    supplier_id: supplier.supplier_id ?? supplier.supplierID ?? supplier.supplierId ?? supplier.id,
    supplierId: supplier.supplierId ?? supplier.supplierID ?? supplier.supplier_id ?? supplier.id,
    name: supplier.name ?? supplier.supplierName ?? "",
    supplierName: supplier.supplierName ?? supplier.name ?? "",
    companyName: supplier.companyName ?? supplier.company_name ?? "",
    company_name: supplier.company_name ?? supplier.companyName ?? "",
    price: supplier.price ?? supplier.supplierPrice ?? supplier.supplier_price ?? 0,
    supplierPrice: supplier.supplierPrice ?? supplier.price ?? supplier.supplier_price ?? 0,
    leadTime: supplier.leadTime ?? supplier.leadTimeDays ?? supplier.lead_time_days ?? 0,
    leadTimeDays: supplier.leadTimeDays ?? supplier.leadTime ?? supplier.lead_time_days ?? 0,
});

export const normalizeProduct = (product = {}) => {
    const category = product.category ? normalizeCategory(product.category) : null;

    return {
        ...product,
        id: product.id ?? product.productID ?? product.productId ?? product.product_id,
        product_id: product.product_id ?? product.productID ?? product.productId ?? product.id,
        productId: product.productId ?? product.productID ?? product.product_id ?? product.id,
        category,
        category_id: product.category_id ?? category?.category_id ?? product.categoryID ?? product.categoryId ?? null,
        categoryId: product.categoryId ?? category?.categoryId ?? product.categoryID ?? product.category_id ?? null,
        name: product.name ?? "",
        sku: product.sku ?? "",
        description: product.description ?? "",
        price: product.price ?? 0,
        stock_quantity: product.stock_quantity ?? product.stockQuantity ?? 0,
        stockQuantity: product.stockQuantity ?? product.stock_quantity ?? 0,
        minimum_stock: product.minimum_stock ?? product.minimumStock ?? 0,
        minimumStock: product.minimumStock ?? product.minimum_stock ?? 0,
        created_at: product.created_at ?? product.createdAt,
        updated_at: product.updated_at ?? product.updatedAt,
        suppliers: (product.suppliers || []).map(normalizeProductSupplier),
    };
};

export const normalizeSupplier = (supplier = {}) => ({
    ...supplier,
    id: supplier.id ?? supplier.supplierID ?? supplier.supplierId ?? supplier.supplier_id,
    supplier_id: supplier.supplier_id ?? supplier.supplierID ?? supplier.supplierId ?? supplier.id,
    supplierId: supplier.supplierId ?? supplier.supplierID ?? supplier.supplier_id ?? supplier.id,
    name: supplier.name ?? "",
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    address: supplier.address ?? "",
    companyName: supplier.companyName ?? supplier.company_name ?? "",
    company_name: supplier.company_name ?? supplier.companyName ?? "",
    products: (supplier.products || []).map((product) => ({
        ...product,
        id: product.id ?? product.productID ?? product.productId ?? product.product_id,
        product_id: product.product_id ?? product.productID ?? product.productId ?? product.id,
        productId: product.productId ?? product.productID ?? product.product_id ?? product.id,
        sku: product.sku ?? "",
        price: product.price ?? product.supplierPrice ?? 0,
        supplierPrice: product.supplierPrice ?? product.price ?? 0,
        leadTime: product.leadTime ?? product.leadTimeDays ?? 0,
        leadTimeDays: product.leadTimeDays ?? product.leadTime ?? 0,
    })),
});

export const normalizeSale = (sale = {}) => ({
    ...sale,
    id: sale.id ?? sale.saleId ?? sale.saleID ?? sale.salesID ?? sale.sale_id ?? sale.sales_id,
    saleId: sale.saleId ?? sale.saleID ?? sale.salesID ?? sale.sale_id ?? sale.sales_id ?? sale.id,
    sale_id: sale.sale_id ?? sale.saleId ?? sale.saleID ?? sale.salesID ?? sale.sales_id ?? sale.id,
    userId: sale.userId ?? sale.user?.userID ?? sale.user?.userId ?? sale.user?.id,
    username: sale.username ?? sale.user?.username,
    cashierName: sale.cashierName ?? sale.user?.username,
    total: sale.total ?? sale.totalAmount ?? sale.total_price ?? sale.totalPrice ?? 0,
    totalPrice: sale.totalPrice ?? sale.totalAmount ?? sale.total ?? 0,
    total_price: sale.total_price ?? sale.totalAmount ?? sale.total ?? 0,
    saleDate: sale.saleDate ?? sale.createdAt,
    status: sale.status,
    paymentMethod: sale.paymentMethod,
    items: (sale.items || []).map((item) => ({
        ...item,
        product_id: item.product_id ?? item.productID ?? item.productId,
        productId: item.productId ?? item.productID ?? item.product_id,
        productName: item.productName ?? item.product_name ?? item.name,
        product_name: item.product_name ?? item.productName ?? item.name,
        quantity: item.quantity ?? 0,
        price: item.price ?? 0,
        subtotal: item.subtotal ?? 0,
    })),
});

export const normalizeInventoryLog = (log = {}) => {
    const product = log.product ? normalizeProduct(log.product) : null;

    return {
        ...log,
        id: log.id ?? log.inventoryLogID ?? log.inventoryLogId ?? log.inventory_log_id,
        inventoryLogId: log.inventoryLogId ?? log.inventoryLogID ?? log.inventory_log_id ?? log.id,
        product,
        productName: log.productName ?? product?.name ?? "",
        sku: log.sku ?? product?.sku ?? "",
        type: log.type,
        quantity: log.quantity ?? 0,
        reason: log.reason ?? "",
        date: log.date ?? log.createdAt,
        createdAt: log.createdAt ?? log.date,
    };
};

export const toProductRequest = (payload = {}) => ({
    name: payload.name,
    sku: payload.sku,
    description: payload.description,
    price: payload.price,
    categoryID: payload.categoryID ?? payload.categoryId ?? payload.category_id,
    categoryId: payload.categoryId ?? payload.categoryID ?? payload.category_id,
    stockQuantity: payload.stockQuantity ?? payload.stock_quantity,
    minimumStock: payload.minimumStock ?? payload.minimum_stock,
});
