# 05 - Frontend Component Reference

This document catalogs the primary reusable UI components located in `frontend/src/components/`, detailing their purpose, prop interfaces, internal state, and application usage.

---

## 1. `DataTable.jsx`

- **Location**: `src/components/DataTable.jsx`
- **Purpose**: A responsive, data-dense table with built-in client-side text filtering, column-based sorting, pagination controls, and row action triggers.
- **Where Used**: `Students.jsx`, `Teachers.jsx`, `Parents.jsx`, `Fees.jsx`, `Exams.jsx`, `Payroll.jsx`.

### Props Interface
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `columns` | `Array<Object>` | Required | Column definitions: `{ header: string, accessor: string \| function, sortable?: boolean }`. |
| `data` | `Array<Object>` | `[]` | Array of row data objects to display. |
| `searchPlaceholder` | `string` | `'Search records...'` | Placeholder text for the search input. |
| `searchable` | `boolean` | `true` | Toggles search bar visibility. |
| `pagination` | `boolean` | `true` | Toggles pagination buttons and row-per-page selector. |
| `initialRowsPerPage` | `number` | `10` | Default number of records per page. |
| `actions` | `function` | `null` | Render prop receiving the row item to display action buttons (Edit, Delete, Pay). |

---

## 2. `Modal.jsx`

- **Location**: `src/components/Modal.jsx`
- **Purpose**: Accessible popup modal dialog with backdrop blur, keyboard escape listener, header with close button, and scrollable content area.
- **Where Used**: Student enrollment, Fee payment recording, Homework creation, Route editing, and Notices authoring.

### Props Interface
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `isOpen` | `boolean` | Required | Controls visibility state. |
| `onClose` | `function` | Required | Callback invoked when user clicks the backdrop or close button. |
| `title` | `string` | `''` | Header title text. |
| `subtitle` | `string` | `''` | Optional subtext displayed under header. |
| `maxWidth` | `string` | `'max-w-2xl'` | Tailwind max-width class (e.g., `'max-w-md'`, `'max-w-4xl'`). |
| `children` | `ReactNode` | Required | Content/form rendered inside the modal body. |

---

## 3. `ConfirmDialog.jsx`

- **Location**: `src/components/ConfirmDialog.jsx`
- **Purpose**: Reusable safety confirmation dialog for dangerous or irreversible actions (e.g., deleting students, voiding fees, deleting homework).
- **Where Used**: Across all administrative management tables.

### Props Interface
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `isOpen` | `boolean` | Required | Visibility toggle. |
| `onClose` | `function` | Required | Invoked when cancelled. |
| `onConfirm` | `function` | Required | Invoked when the user confirms the destructive action. |
| `title` | `string` | `'Confirm Action'` | Warning title. |
| `message` | `string` | Required | Detailed explanation of what will be deleted/modified. |
| `confirmText` | `string` | `'Confirm'` | Text on confirmation button. |
| `danger` | `boolean` | `true` | Styles confirmation button in destructive red theme. |

---

## 4. `StatCard.jsx`

- **Location**: `src/components/StatCard.jsx`
- **Purpose**: Key Performance Indicator (KPI) widget showcasing primary counts, percentage trends, and themed iconography.
- **Where Used**: `Dashboard.jsx`, `Fees.jsx`, `Payroll.jsx`, `Attendance.jsx`.

### Props Interface
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | Required | Label of the metric (e.g., `'Total Scholars'`). |
| `value` | `string \| number` | Required | Highlighted statistic (e.g., `'154'`, `'$1,750'`). |
| `icon` | `LucideIcon` | Required | Icon component reference from `lucide-react`. |
| `color` | `string` | `'cyan'` | Accent color theme (`'cyan'`, `'teal'`, `'emerald'`, `'purple'`, `'amber'`, `'rose'`). |
| `trend` | `string` | `null` | Optional trend text (e.g., `'+12% vs last term'`). |
| `trendUp` | `boolean` | `true` | Controls green (positive) vs red (negative) trend badge styling. |
| `subtitle` | `string` | `null` | Secondary descriptor underneath value. |

---

## 5. `StatusBadge.jsx`

- **Location**: `src/components/StatusBadge.jsx`
- **Purpose**: Renders status strings as high-contrast colored pills with micro-indicators.
- **Where Used**: Attendance table (`Present`, `Absent`, `Late`), Fees (`Paid`, `Pending`, `Overdue`), Payroll (`Paid`, `Processing`), Exams (`Published`, `Draft`).

### Props Interface
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `status` | `string` | Required | Raw status value. Automatically maps known statuses to corresponding badge colors. |
| `size` | `string` | `'md'` | Size variant (`'sm'`, `'md'`). |

---

## 6. `PrintableReceipt.jsx`

- **Location**: `src/components/PrintableReceipt.jsx`
- **Purpose**: Generates an institutional tuition and fee invoice receipt designed for browser printing (`window.print()`) or PDF export.
- **Where Used**: In `Fees.jsx` when printing or viewing receipts.

### Props Interface
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `fee` | `Object` | Required | Fee record containing student details, fee breakdown, transaction ID, and payment method. |
| `school` | `Object` | Required | School branding object from `SchoolContext` (school name, address, tax number, logo). |
| `onClose` | `function` | Required | Callback to dismiss print view. |

---

## 7. `ChildSelector.jsx`

- **Location**: `src/components/ChildSelector.jsx`
- **Purpose**: Multi-child student switcher for parent accounts with more than one enrolled student.
- **Where Used**: Displayed in `Navbar.jsx` when logged in as a `parent`.
- **State**: Synchronized with `AuthContext` (`childrenList`, `activeChild`, `switchActiveChild`).

---

## 8. `Sidebar.jsx` & `Navbar.jsx`

- **Sidebar**: Renders the complete administrative navigation menu. Automatically filters menu sections based on the logged-in user's role (`super_admin`, `principal`, `teacher`, `parent`, `student`). Supports desktop expand/collapse and mobile sliding drawer.
- **Navbar**: Top header bar displaying active page title, current academic session (`2026–2027`), `ChildSelector` (for parents), dynamic school badge, profile quick-link, and logout action.
