export const formatCurrency = (amount, currency = '$') => {
  if (amount === undefined || amount === null) return `${currency}0`;
  return `${currency}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date) => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return String(date);
  }
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(date);
  }
};

export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Human-friendly role labels shown in Navbar / Sidebar
export const getRoleLabel = (role) => {
  const labels = {
    super_admin: 'Super Admin',
    admin:       'Admin',
    principal:   'Admin',
    teacher:     'Teacher',
    parent:      'Parent',
    student:     'Student'
  };
  return labels[role] || (role ? role.replace(/_/g, ' ') : 'User');
};

// Tailwind badge colors per role (bg + text)
export const getRoleBadgeClass = (role) => {
  const map = {
    super_admin: 'bg-violet-100 text-violet-800 border-violet-200',
    admin:       'bg-indigo-100 text-indigo-800 border-indigo-200',
    principal:   'bg-blue-100   text-blue-800   border-blue-200',
    teacher:     'bg-emerald-100 text-emerald-800 border-emerald-200',
    parent:      'bg-amber-100  text-amber-800  border-amber-200',
    student:     'bg-cyan-100   text-cyan-800   border-cyan-200'
  };
  return map[role] || 'bg-gray-100 text-gray-800 border-gray-200';
};
