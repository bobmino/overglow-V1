from pathlib import Path
import re

files = [
  'frontend/src/pages/AdminProductsPage.jsx',
  'frontend/src/pages/AdminBlogFormPage.jsx',
  'frontend/src/pages/AdminBlogPage.jsx',
  'frontend/src/pages/OperatorProductsPage.jsx',
  'frontend/src/pages/AdminPendingPaymentsPage.jsx',
  'frontend/src/pages/ApprovalRequestsPage.jsx',
  'frontend/src/pages/OperatorProductFormPage.jsx',
  'frontend/src/pages/AdminBadgeRequestsPage.jsx',
  'frontend/src/pages/InquiriesPage.jsx',
  'frontend/src/pages/AdminBadgeManagementPage.jsx',
  'frontend/src/pages/AdminOperatorsPage.jsx',
  'frontend/src/pages/AdminUsersPage.jsx',
  'frontend/src/pages/AnalyticsPage.jsx',
  'frontend/src/pages/OperatorBookingsPage.jsx',
  'frontend/src/pages/AdminWithdrawalsPage.jsx',
]

for f in files:
    p = Path(f)
    text = p.read_text(encoding='utf-8')
    orig = text
    text = re.sub(
        r"import DashboardNavBar from ['\"]\.\./components/DashboardNavBar['\"];\r?\n",
        '',
        text,
    )
    text = re.sub(r"\s*<DashboardNavBar\s*/>", '', text)
    if text != orig:
        p.write_text(text, encoding='utf-8')
        print('cleaned', f)
    else:
        print('nochange', f)
