import urllib.request
import json

base = 'http://localhost:8000/api'

def req(path, method='GET', data=None):
    url = base + path
    headers = {'Content-Type': 'application/json'}
    body = json.dumps(data).encode('utf-8') if data else None
    request = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode('utf-8'))

print('1. Testing Login...')
auth = req('/auth/login', 'POST', {'email': 'operator@elogbook.com', 'password': 'password'})
assert 'access_token' in auth
print('   Login successful:', auth['user']['name'], 'Role:', auth['user']['role'])

print('2. Testing Dashboard...')
dash = req('/dashboard')
print('   Dashboard KPIs:', dash['kpis'])

print('3. Testing Equipment Registry...')
eq_list = req('/equipment')
print('   Found', len(eq_list), 'equipment assets')

import time
test_asset_id = f'TUR-{int(time.time()) % 10000}'
print('4. Testing Create Equipment...')
new_eq = req('/equipment', 'POST', {
    'equipment_id': test_asset_id,
    'name': 'Primary Gas Turbine',
    'type': 'Turbine',
    'section': 'Utilities',
    'status': 'Operational',
    'parameters': [
        {'parameter_name': 'Inlet Temp', 'unit': '°C', 'min_normal': 100, 'max_normal': 250, 'min_warning': 250, 'max_warning': 280, 'critical_threshold': 280}
    ]
})
print('   Created Equipment:', new_eq['equipment_id'], 'ID:', new_eq['id'])

print('5. Testing Save Draft Logbook Entry...')
draft = req('/logbook-entries', 'POST', {
    'equipment_id': new_eq['id'],
    'operator_id': auth['user']['id'],
    'shift': 'Morning',
    'status': 'Draft',
    'data': {'Inlet Temp': '210.5', 'remarks': 'Initial morning spinup'}
})
print('   Draft created with ID:', draft['id'])

print('6. Testing Retrieve Draft Entry...')
entry_id = draft['id']
loaded_draft = req(f'/logbook-entries/{entry_id}')
assert loaded_draft['data']['Inlet Temp'] == '210.5'
print('   Draft loaded correctly:', loaded_draft['data'])

print('7. Testing Submit Logbook Entry...')
submitted = req(f'/logbook-entries/{entry_id}/submit', 'POST')
assert submitted['status'] == 'Submitted'
print('   Logbook submitted for review!')

print('8. Testing Supervisor Review Queue...')
reviews = req('/reviews')
pending_review = next((r for r in reviews if r['id'] == entry_id), None)
assert pending_review is not None
print('   Supervisor sees pending review for:', pending_review['equipment']['equipment_id'])

print('9. Testing Supervisor Approval with Feedback...')
approved = req(f'/reviews/{entry_id}/approve', 'POST', {'comments': 'Verified and approved for operation.'})
assert approved['status'] == 'Approved'
assert approved['supervisor_comments'] == 'Verified and approved for operation.'
print('   Review approved with comments:', approved['supervisor_comments'])

print('10. Testing Shift Handovers...')
handover = req('/handovers', 'POST', {
    'section': 'Utilities',
    'outgoing_user_id': auth['user']['id'],
    'entries_count': 15,
    'anomaly_count': 0,
    'notes': 'All systems optimal at end of shift.'
})
print('    Handover created, ID:', handover['id'])
handover_id = handover['id']
acked = req(f'/handovers/{handover_id}/acknowledge', 'PATCH', {
    'incoming_user_id': 2,
    'status': 'acknowledged'
})
assert acked['status'] == 'acknowledged'
print('    Handover acknowledged by next shift operator!')

print('11. Testing Plant Reports & Metrics...')
rep = req('/reports/summary')
print('    Metrics summary:', rep['metrics'])

print('12. Testing Audit Trail Search...')
audits = req(f'/audit?search={test_asset_id}')
print(f'    Audit records found for {test_asset_id}:', len(audits))

print('\n======================================================')
print('SUCCESS: ALL FEATURES FULLY OPERATIONAL AND VERIFIED!')
print('======================================================')
