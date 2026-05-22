# Backend TODO for Frontend Completion

This file documents backend work required by the completed frontend screens. Do not implement these in the frontend.

## Inventory Logs

- Add `GET /api/inventory-logs`.
- Support filters:
  - `startDate`
  - `endDate`
  - `product` or `productId`
  - `type` values: `STOCK_IN`, `STOCK_OUT`, `ADJUSTMENT`
- Support pagination:
  - `page`
  - `limit`
  - response fields: `logs`, `totalItems`, `totalPages`, `page`, `limit`
- Support sorting:
  - `sortBy` fields such as `date`, `productName`, `type`, `quantity`
  - `sortDirection` values: `asc`, `desc`
- Return each inventory log with:
  - `id`
  - `date` or `createdAt`
  - `productName`
  - `sku`
  - `type`
  - `quantity`
  - `previousStock`
  - `newStock`
  - `reason` or `notes`
  - `userName`
- Add `POST /api/inventory-logs` only if manual inventory adjustments need to be created outside product stock updates.

## Reports

- Add `GET /api/reports/sales-summary`.
- Add `GET /api/reports/inventory-movement`.
- Add `GET /api/reports/low-stock`.
- Add `GET /api/reports/category-performance`.
- Add `GET /api/reports/supplier-performance`.
- Standard report filters:
  - `startDate`
  - `endDate`
  - `categoryId`
  - `productId`
  - `supplierId`
- Each report should return summary KPI data, chart-ready series data, and table row data.

## Export Endpoints

- Add CSV export endpoints for each report.
- Add PDF export endpoints for each report.
- Suggested route pattern:
  - `GET /api/reports/{reportName}/export?format=csv`
  - `GET /api/reports/{reportName}/export?format=pdf`
- Exports should honor the same filters used by the report UI.

## Analytics Enhancements

- Add aggregated analytics endpoints for reusable dashboard/report widgets.
- Add `GET /api/dashboard/summary` with:
  - total sales
  - transaction count
  - low stock count
  - stock movement count
  - top category
  - top supplier
- Add trend endpoints for chart widgets:
  - sales over time
  - stock movement over time
  - category revenue share
  - supplier fill rate or purchase contribution

## Settings and Account

- Add account update endpoints that preserve the active session:
  - update username
  - update email
  - change password
- These endpoints must not invalidate access/refresh tokens unless explicitly required by security policy.
- Return the updated authenticated user payload after profile changes so the frontend can refresh local user state.
