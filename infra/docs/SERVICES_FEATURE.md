# Custom Family Services Feature

## Overview
Users can now add custom services when creating or editing a family. Services can be selected from predefined options or added as custom services specific to each family.

## Features

### 1. Predefined Services
Users can quickly select from common postpartum services:
- Night Support
- Lactation Counseling
- Newborn Care
- Sibling Adaptation
- Meal Prep
- Light Housekeeping
- Postpartum Yoga
- PPA/PPD Emotional Support
- Sleep Training

### 2. Custom Services
Users can add any custom service needed for a specific family by:
1. Typing the service name in the "Add Custom Service" input field
2. Pressing Enter or clicking the "Add" button
3. The custom service is added to the selected services list

### 3. Service Management
- **View Selected Services**: All selected services (predefined + custom) are displayed with an × button to remove
- **Edit Services**: When editing a family, all previously selected services are pre-populated
- **Delete Services**: Click the × button next to any service to remove it

## Implementation Details

### Data Storage
- Services are stored as a comma-separated string in the `services_needed` field of the families table
- This approach maintains backward compatibility with existing data
- Each service is trimmed and stored with consistent formatting

### User Isolation
- Services are family-specific, meaning different families can have different service lists
- Only the user who created the family can edit the family's services
- User isolation is enforced via the `user_id` field in the families table

### File Changes
1. **src/app/(protected)/families/page.js**
   - Added `customServiceInput` state to manage custom service input
   - Added `addCustomService()` function to add custom services
   - Added `removeService()` function to remove services
   - Updated services section in the modal form with predefined options and custom input
   - Services are displayed with visual feedback showing selected count

### Database Schema (Optional Enhancement)
A `family_services` table can be created for more granular control if needed:

```sql
CREATE TABLE public.family_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  is_predefined BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_services_family_id ON family_services(family_id);
CREATE INDEX idx_family_services_user_id ON family_services(user_id);
CREATE UNIQUE INDEX idx_family_services_unique ON family_services(family_id, service_name);
```

## Usage Flow

### Creating a Family with Services
1. Click "+ Add New Family" button
2. Fill in family details (mother's name, partner's name, etc.)
3. Select predefined services by clicking the service buttons
4. (Optional) Add custom services:
   - Type service name in the input field
   - Press Enter or click "Add" button
5. Review selected services in the "Selected" section
6. Click "Create Family Profile" to save

### Editing Family Services
1. Click the edit icon on an existing family
2. The modal opens with previously selected services
3. Toggle services on/off or remove custom ones
4. Add new custom services as needed
5. Click "Update Family" to save changes

### Removing Services
- Click the × button next to any service in the selected services list
- The service is immediately removed from the selection

## Security Considerations

1. **User Isolation**: Services are tied to families, which are tied to users
2. **Data Integrity**: Services are validated on the frontend (no empty strings)
3. **Backward Compatibility**: Existing comma-separated strings in the database continue to work

## Future Enhancements

1. Create a dedicated `family_services` table for more granular control
2. Add service templates by user role
3. Add service availability/capacity tracking
4. Add service pricing per family
5. Add service scheduling alongside visits

## Testing Checklist

- [x] Create family with predefined services only
- [x] Create family with custom services only
- [x] Create family with mix of predefined and custom services
- [x] Edit family to add more services
- [x] Edit family to remove services
- [x] Verify services persist after save
- [x] Verify services display correctly in family list
- [x] Verify services display correctly in family details page
- [x] Test with special characters in custom service names
- [x] Test with long custom service names
