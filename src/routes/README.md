# src/routes

The shared application shell, the homepage article list, and the application
error page. Layout and page remote queries supply viewer identity and homepage
data, and components call these queries directly, following the
[initial-data conventions](../../docs/architecture.md#initial-data-and-pagination).
