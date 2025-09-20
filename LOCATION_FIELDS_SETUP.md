# Location Fields Setup

This document explains how to add location fields (city, state, country) to the business profile in both the onboarding and settings pages.

## What's Added

### Database Changes
- Added `city`, `state`, and `country` columns to the `user_profiles` table
- All fields are TEXT type and nullable
- Added proper column comments for documentation

### Frontend Changes
- **Onboarding Page**: Added a new step (step 5) for location information
- **Settings Page**: Added location fields to the Business Profile section
- Both pages now collect and save city, state, and country information

### Mandatory Field Validation
- **Required Fields**: Business Name, Industry/Niche, City, and Country are mandatory
- **Dashboard Access**: Users cannot access the dashboard until all required fields are completed
- **Automatic Redirect**: Users with incomplete profiles are redirected to settings with a message
- **Visual Indicators**: Required fields are marked with * and explanatory text
- **Color Coding**: Incomplete required fields appear in red for easy identification
- **Completion Status**: Visual progress indicator shows profile completion status

## Files Modified

1. **Database Migration**: `add-location-fields.sql`
2. **Onboarding Page**: `app/onboarding/page.tsx`
3. **Settings Page**: `app/settings/page.tsx`
4. **Migration Script**: `run-location-migration.js`
5. **New Components**: `components/ui/CountrySelect.tsx`, `components/ui/StateSelect.tsx`
6. **Data Sources**: `lib/countries.ts`, `lib/states.ts`

## Setup Instructions

### 1. Run Database Migration

First, run the SQL migration to add the new columns:

```bash
# Option 1: Run directly in Supabase SQL editor
# Copy and paste the contents of add-location-fields.sql

# Option 2: Use the Node.js script (requires service role key)
node run-location-migration.js
```

### 2. Verify Migration

Check that the new columns were added:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('city', 'state', 'country')
ORDER BY column_name;
```

### 3. Test the Changes

1. **Onboarding Flow**: New users will see a 5-step process instead of 4
2. **Settings Page**: Existing users can edit their location information
3. **Data Persistence**: Location data is saved to the database

## Field Descriptions

- **Business Name***: The name of your business (Required)
- **Industry/Niche***: The industry or niche your business operates in (Required)
- **City***: The city where the business is located (Required)
- **State/Province**: The state, province, or region where the business is located (Optional) - Dynamic dropdown based on selected country
- **Country***: The country where the business is located (Required) - Dropdown selection from 195+ countries

*Required fields must be completed to access the dashboard

## Usage

### For New Users
- Location information is collected during onboarding (step 5)
- City and Country are required; State/Province is optional
- All required fields must be completed to access the dashboard

### For Existing Users
- Location fields can be updated in the Settings page
- Fields are displayed in the Business Profile section
- Click "Edit" to modify location information
- Required fields are marked with * and must be completed
- Users with incomplete profiles are redirected to settings

## Benefits

1. **Localized Content**: AI can generate location-specific content
2. **Better Targeting**: Content can reference local events, holidays, or cultural context
3. **Business Insights**: Location data helps with analytics and business intelligence
4. **Compliance**: Some regions have specific business requirements
5. **Data Quality**: Ensures complete business profiles for better AI content generation
6. **User Experience**: Prevents users from accessing incomplete dashboard features
7. **Country Selection**: Dropdown with 195+ countries ensures accurate and consistent data entry
8. **Search Functionality**: Easy country search for quick selection

## Dashboard Access Control

- **Required Fields Check**: Dashboard validates that Business Name, Industry/Niche, City, and Country are completed
- **Automatic Redirect**: Users with incomplete profiles are redirected to settings with a helpful message
- **Clear Messaging**: Users see exactly which fields need to be completed
- **Seamless Flow**: Once required fields are completed, users can access the dashboard normally

## Visual Feedback System

- **Red Indicators**: Incomplete required fields appear in red (labels, values, and input borders)
- **Green Indicators**: Complete profiles show green completion status
- **Progress Counter**: Shows "X/4 required fields completed" for clear progress tracking
- **Status Messages**: Dynamic messages based on completion status
- **Color-Coded Borders**: Input fields have red borders when incomplete
- **Enhanced Typography**: User-entered details are displayed in larger, bolder text for better readability
- **Visual Hierarchy**: Clear distinction between labels and values with improved typography

## Country Selection Component

- **Comprehensive List**: 195+ countries with official names
- **Search Functionality**: Type to search for countries quickly
- **Dropdown Interface**: Clean, accessible dropdown design
- **Keyboard Navigation**: Full keyboard support for accessibility
- **Responsive Design**: Works on all device sizes
- **Validation Support**: Integrates with required field validation
- **Consistent Data**: Ensures standardized country names

## Notes

- Required fields (Business Name, Industry/Niche, City, Country) must be completed to access the dashboard
- State/Province is optional and not required for dashboard access
- The onboarding flow requires all mandatory fields to be filled before completion
- Location data is stored as plain text for maximum flexibility
- Country selection uses a dropdown with 195+ countries for consistency
- No validation is applied to city/state formats (users can enter any text)
- Users with incomplete profiles are automatically redirected to settings

## Troubleshooting

### Migration Issues
- Ensure you have the `SUPABASE_SERVICE_ROLE_KEY` environment variable set
- Check that the `user_profiles` table exists before running migration
- Verify RLS policies allow the service role to modify the table

### Frontend Issues
- Clear browser cache if changes don't appear
- Check browser console for any JavaScript errors
- Ensure the updated components are properly imported

## State/Province Selection Component

- **Dynamic Dropdown**: States change based on selected country
- **Country-Specific Data**: Currently supports US, Canada, India, Australia, UK, and Germany
- **Smart Validation**: Automatically resets state when country changes
- **Search Functionality**: Type to search for states/provinces quickly
- **Fallback Handling**: Shows appropriate message for countries without state data
- **Consistent Interface**: Same design pattern as country selection

## Future Enhancements

- Add location validation (e.g., country codes, city autocomplete)
- Integrate with mapping services for coordinates
- Add timezone information based on location
- Support for multiple business locations
- Expand state/province coverage to more countries
- Add major cities dropdown for popular countries
