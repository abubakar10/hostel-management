import { Alert } from 'react-native';
import api from '../../config/api';
import ResourceScreen from '../../components/ResourceScreen';
import { SecondaryButton } from '../../components/ui';

export function PeopleScreen() {
  return (
    <ResourceScreen
      title="People living here"
      subtitle="Add, find, and update residents. Their first password is their ID."
      endpoint="/api/students"
      createLabel="Add a person"
      searchPlaceholder="Search by name, ID, or email"
      searchKeys={['first_name', 'last_name', 'student_id', 'email']}
      itemTitle={(r) => `${r.first_name} ${r.last_name}`}
      itemSubtitle={(r) => `${r.student_id} · ${r.email || ''} · Room ${r.room_number || 'none'}`}
      itemBadge={(r) => ({ text: r.status || 'active', tone: r.status === 'active' ? 'success' : 'muted' })}
      fields={[
        { key: 'student_id', label: 'Student ID', required: true },
        { key: 'first_name', label: 'First name', required: true },
        { key: 'last_name', label: 'Last name', required: true },
        { key: 'email', label: 'Email', required: true, keyboardType: 'email-address' },
        { key: 'phone', label: 'Phone', keyboardType: 'phone-pad' },
        { key: 'address', label: 'Address', multiline: true },
        { key: 'date_of_birth', label: 'Date of birth (YYYY-MM-DD)' },
        { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
        { key: 'resident_type', label: 'Type', type: 'select', defaultValue: 'student', options: [
          { value: 'student', label: 'Student' },
          { value: 'job_based', label: 'Job based' },
          { value: 'short_term', label: 'Short term' },
        ]},
        { key: 'course', label: 'Course' },
        { key: 'year_of_study', label: 'Year of study', keyboardType: 'number-pad' },
        { key: 'status', label: 'Status', type: 'select', defaultValue: 'active', options: ['active', 'inactive'] },
      ]}
    />
  );
}

export function RoomsScreen() {
  return (
    <ResourceScreen
      title="Rooms"
      subtitle="See which rooms are free and who lives where."
      endpoint="/api/rooms"
      createLabel="Add room"
      searchKeys={['room_number', 'status']}
      itemTitle={(r) => `Room ${r.room_number}`}
      itemSubtitle={(r) => `${r.current_occupancy || 0}/${r.capacity} filled · Floor ${r.floor || '-'}`}
      itemBadge={(r) => ({ text: r.status || 'available', tone: r.status === 'available' ? 'success' : 'warning' })}
      fields={[
        { key: 'room_number', label: 'Room number', required: true },
        { key: 'floor', label: 'Floor', keyboardType: 'number-pad' },
        { key: 'capacity', label: 'How many beds', required: true, keyboardType: 'number-pad' },
        { key: 'status', label: 'Status', type: 'select', defaultValue: 'available', options: ['available', 'occupied', 'maintenance'] },
      ]}
    />
  );
}

export function PaymentsScreen() {
  return (
    <ResourceScreen
      title="Payments"
      subtitle="Add bills and mark them paid when money is collected at the office."
      endpoint="/api/fees"
      createLabel="Add bill"
      searchKeys={['first_name', 'last_name', 'student_number', 'fee_type', 'status']}
      itemTitle={(r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Payment'}
      itemSubtitle={(r) => `${r.fee_type} · RS ${r.amount} · due ${r.due_date ? String(r.due_date).slice(0, 10) : ''}`}
      itemBadge={(r) => ({
        text: r.status,
        tone: r.status === 'paid' ? 'success' : r.status === 'overdue' ? 'danger' : 'warning',
      })}
      fields={[
        { key: 'student_id', label: 'Student record ID', required: true, keyboardType: 'number-pad' },
        { key: 'fee_type', label: 'Type', type: 'select', defaultValue: 'hostel', options: ['hostel', 'mess', 'security', 'fine'] },
        { key: 'amount', label: 'Amount', required: true, keyboardType: 'decimal-pad' },
        { key: 'due_date', label: 'Due date (YYYY-MM-DD)', required: true },
        { key: 'payment_method', label: 'How they paid' },
      ]}
      extraItemActions={(item, reload) =>
        item.status !== 'paid' ? (
          <SecondaryButton
            title="Mark paid"
            onPress={async () => {
              try {
                await api.put(`/api/fees/${item.id}`, { status: 'paid', paid_date: new Date().toISOString().slice(0, 10) });
                reload();
              } catch (e) {
                Alert.alert('Could not mark paid', e.response?.data?.error || 'Try again');
              }
            }}
          />
        ) : null
      }
    />
  );
}

export function StaffScreen() {
  return (
    <ResourceScreen
      title="Staff"
      subtitle="Keep names and contact details of people who work here."
      endpoint="/api/staff"
      createLabel="Add staff"
      searchKeys={['first_name', 'last_name', 'staff_id', 'role']}
      itemTitle={(r) => `${r.first_name} ${r.last_name}`}
      itemSubtitle={(r) => `${r.role} · ${r.phone || r.email || ''}`}
      fields={[
        { key: 'staff_id', label: 'Staff ID', required: true },
        { key: 'first_name', label: 'First name', required: true },
        { key: 'last_name', label: 'Last name', required: true },
        { key: 'email', label: 'Email', keyboardType: 'email-address' },
        { key: 'phone', label: 'Phone', keyboardType: 'phone-pad' },
        { key: 'role', label: 'Job', type: 'select', defaultValue: 'warden', options: ['warden', 'cleaner', 'security', 'chef', 'finance'] },
        { key: 'shift', label: 'Shift' },
        { key: 'salary', label: 'Salary', keyboardType: 'decimal-pad' },
        { key: 'hire_date', label: 'Hire date (YYYY-MM-DD)' },
        { key: 'status', label: 'Status', type: 'select', defaultValue: 'active', options: ['active', 'inactive'] },
      ]}
    />
  );
}

export function VisitorsScreen() {
  return (
    <ResourceScreen
      title="Visitors"
      subtitle="Write down guests when they come in, and tick them out when they leave."
      endpoint="/api/visitors"
      createLabel="Check in visitor"
      searchKeys={['visitor_name', 'visitor_phone', 'first_name', 'last_name']}
      itemTitle={(r) => r.visitor_name}
      itemSubtitle={(r) => `Visiting ${r.first_name || ''} ${r.last_name || ''} · ${r.status || 'inside'}`}
      itemBadge={(r) => ({ text: r.status || 'inside', tone: r.status === 'exited' ? 'muted' : 'primary' })}
      fields={[
        { key: 'student_id', label: 'Student record ID', required: true, keyboardType: 'number-pad' },
        { key: 'visitor_name', label: 'Visitor name', required: true },
        { key: 'visitor_phone', label: 'Phone', keyboardType: 'phone-pad' },
        { key: 'visitor_id_type', label: 'ID type', type: 'select', defaultValue: 'CNIC', options: ['CNIC', 'Passport', 'Other'] },
        { key: 'visitor_id_number', label: 'ID number' },
        { key: 'relationship', label: 'Relation' },
        { key: 'purpose', label: 'Purpose', multiline: true },
      ]}
      extraItemActions={(item, reload) =>
        item.status !== 'exited' ? (
          <SecondaryButton
            title="Check out"
            onPress={async () => {
              try {
                await api.put(`/api/visitors/${item.id}/checkout`);
                reload();
              } catch (e) {
                Alert.alert('Could not check out', e.response?.data?.error || 'Try again');
              }
            }}
          />
        ) : null
      }
    />
  );
}

export function LeavesScreen() {
  return (
    <ResourceScreen
      title="Leave requests"
      subtitle="Say yes or no when someone asks to go home."
      endpoint="/api/leaves"
      createLabel="Add leave"
      searchKeys={['first_name', 'last_name', 'leave_type', 'status']}
      itemTitle={(r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Leave'}
      itemSubtitle={(r) => `${r.leave_type} · ${String(r.start_date || '').slice(0, 10)} to ${String(r.end_date || '').slice(0, 10)}`}
      itemBadge={(r) => ({
        text: r.status,
        tone: r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning',
      })}
      fields={[
        { key: 'student_id', label: 'Student record ID', required: true, keyboardType: 'number-pad' },
        { key: 'leave_type', label: 'Type', type: 'select', defaultValue: 'vacation', options: ['vacation', 'emergency', 'weekend'] },
        { key: 'start_date', label: 'Start date (YYYY-MM-DD)', required: true },
        { key: 'end_date', label: 'End date (YYYY-MM-DD)', required: true },
        { key: 'reason', label: 'Reason', required: true, multiline: true },
        { key: 'emergency_contact', label: 'Emergency contact' },
        { key: 'status', label: 'Decision', type: 'select', defaultValue: 'pending', options: ['pending', 'approved', 'rejected'] },
        { key: 'remarks', label: 'Remarks', multiline: true },
      ]}
    />
  );
}

export function ProblemsScreen() {
  return (
    <ResourceScreen
      title="Problems"
      subtitle="Read what residents reported and mark when it is fixed."
      endpoint="/api/complaints"
      createLabel="Log a problem"
      searchKeys={['title', 'category', 'status', 'first_name']}
      itemTitle={(r) => r.title}
      itemSubtitle={(r) => `${r.category || 'other'} · ${r.first_name || ''} ${r.last_name || ''}`}
      itemBadge={(r) => ({
        text: r.status,
        tone: r.status === 'resolved' || r.status === 'closed' ? 'success' : r.status === 'open' ? 'warning' : 'primary',
      })}
      fields={[
        { key: 'student_id', label: 'Student record ID', required: true, keyboardType: 'number-pad' },
        { key: 'title', label: 'Title', required: true },
        { key: 'description', label: 'What happened', required: true, multiline: true },
        { key: 'category', label: 'Category', type: 'select', defaultValue: 'other', options: ['maintenance', 'cleanliness', 'security', 'other'] },
        { key: 'priority', label: 'Priority', type: 'select', defaultValue: 'medium', options: ['low', 'medium', 'high'] },
        { key: 'status', label: 'Status', type: 'select', defaultValue: 'open', options: ['open', 'in_progress', 'resolved', 'closed'] },
        { key: 'resolution', label: 'Resolution notes', multiline: true },
      ]}
    />
  );
}

export function RepairsScreen() {
  return (
    <ResourceScreen
      title="Repairs"
      subtitle="Track broken things in rooms until they are fixed."
      endpoint="/api/complaints/maintenance"
      listEndpoint="/api/complaints/maintenance/all"
      createEndpoint="/api/complaints/maintenance"
      itemPath={(id) => `/api/complaints/maintenance/${id}`}
      createLabel="Add repair"
      searchKeys={['title', 'status', 'priority']}
      itemTitle={(r) => r.title}
      itemSubtitle={(r) => r.description}
      itemBadge={(r) => ({
        text: r.status,
        tone: r.status === 'completed' ? 'success' : r.status === 'pending' ? 'warning' : 'primary',
      })}
      fields={[
        { key: 'room_id', label: 'Room record ID', required: true, keyboardType: 'number-pad' },
        { key: 'requested_by', label: 'Requested by student ID', keyboardType: 'number-pad' },
        { key: 'title', label: 'Title', required: true },
        { key: 'description', label: 'Details', required: true, multiline: true },
        { key: 'priority', label: 'Priority', type: 'select', defaultValue: 'medium', options: ['low', 'medium', 'high'] },
        { key: 'status', label: 'Status', type: 'select', defaultValue: 'pending', options: ['pending', 'in_progress', 'completed'] },
        { key: 'cost', label: 'Cost', keyboardType: 'decimal-pad' },
      ]}
    />
  );
}

export function RoomChangeScreen() {
  return (
    <ResourceScreen
      title="Room change"
      subtitle="Approve or reject when someone wants a different room."
      endpoint="/api/room-transfers"
      createLabel="Add request"
      searchKeys={['first_name', 'last_name', 'status', 'reason']}
      itemTitle={(r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Transfer'}
      itemSubtitle={(r) => `From ${r.from_room || '-'} to ${r.to_room || '-'} · ${r.reason || ''}`}
      itemBadge={(r) => ({
        text: r.status,
        tone: r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning',
      })}
      fields={[
        { key: 'student_id', label: 'Student record ID', required: true, keyboardType: 'number-pad' },
        { key: 'to_room_id', label: 'New room ID', required: true, keyboardType: 'number-pad' },
        { key: 'reason', label: 'Reason', required: true, multiline: true },
        { key: 'status', label: 'Decision', type: 'select', defaultValue: 'pending', options: ['pending', 'approved', 'rejected'] },
      ]}
    />
  );
}

export function StockScreen() {
  return (
    <ResourceScreen
      title="Stock"
      subtitle="Keep count of furniture, cleaning items, and kitchen supplies."
      endpoint="/api/inventory"
      createLabel="Add item"
      searchKeys={['item_name', 'category', 'location']}
      itemTitle={(r) => r.item_name}
      itemSubtitle={(r) => `${r.quantity} ${r.unit || ''} · ${r.location || ''} · ${r.condition || ''}`}
      fields={[
        { key: 'item_name', label: 'Item name', required: true },
        { key: 'category', label: 'Category' },
        { key: 'quantity', label: 'Quantity', required: true, keyboardType: 'number-pad' },
        { key: 'unit', label: 'Unit', defaultValue: 'pieces' },
        { key: 'location', label: 'Where it is' },
        { key: 'condition', label: 'Condition', type: 'select', defaultValue: 'good', options: ['good', 'fair', 'poor'] },
        { key: 'purchase_date', label: 'Purchase date (YYYY-MM-DD)' },
        { key: 'purchase_price', label: 'Price', keyboardType: 'decimal-pad' },
        { key: 'supplier', label: 'Supplier' },
      ]}
    />
  );
}

export function FilesScreen() {
  return (
    <ResourceScreen
      title="Files"
      subtitle="Keep ID cards, forms, and photos in one place. Upload from the web app if you need a file picker."
      endpoint="/api/documents"
      canCreate={false}
      canEdit={false}
      searchKeys={['file_name', 'document_type', 'student_id', 'first_name']}
      itemTitle={(r) => r.file_name || r.document_type}
      itemSubtitle={(r) => `${r.document_type} · ${r.student_first_name || ''} ${r.student_last_name || ''}`}
    />
  );
}

export function HostelsScreen() {
  return (
    <ResourceScreen
      title="Hostels"
      subtitle="Add or edit the buildings you manage."
      endpoint="/api/hostels"
      createLabel="Add hostel"
      searchKeys={['name', 'address', 'phone']}
      itemTitle={(r) => r.name}
      itemSubtitle={(r) => r.address}
      itemBadge={(r) => ({ text: r.status, tone: r.status === 'active' ? 'success' : 'muted' })}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'address', label: 'Address', multiline: true },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'total_rooms', label: 'Total rooms', keyboardType: 'number-pad' },
        { key: 'total_capacity', label: 'Total beds', keyboardType: 'number-pad' },
        { key: 'status', label: 'Status', type: 'select', defaultValue: 'active', options: ['active', 'inactive'] },
      ]}
    />
  );
}

export function ManagersScreen() {
  return (
    <ResourceScreen
      title="Managers"
      subtitle="Create login accounts for people who run each hostel."
      endpoint="/api/users"
      createLabel="Add manager"
      searchKeys={['username', 'email', 'role']}
      itemTitle={(r) => r.username}
      itemSubtitle={(r) => `${r.email} · ${r.role} · hostel ${r.hostel_name || r.hostel_id || 'all'}`}
      fields={[
        { key: 'username', label: 'Username', required: true },
        { key: 'email', label: 'Email', required: true, keyboardType: 'email-address' },
        { key: 'password', label: 'Password' },
        { key: 'role', label: 'Role', type: 'select', defaultValue: 'admin', options: ['admin', 'super_admin'] },
        { key: 'hostel_id', label: 'Hostel ID', keyboardType: 'number-pad' },
      ]}
      transformUpdate={(form) => {
        const body = { ...form };
        if (!body.password) delete body.password;
        return body;
      }}
    />
  );
}
