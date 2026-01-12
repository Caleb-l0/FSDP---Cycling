# Institution Event Booking System - Implementation Summary

## Overview
This implementation adds a comprehensive event booking system for institutions, allowing them to view, request to book, and manage events created by admins.

## Database Changes Required

### 1. Run Migration Script
Execute `MIGRATION_eventbookings_update.sql` to add the following columns to the `eventbookings` table:
- `status` (VARCHAR(20)) - Values: 'Pending', 'Approved', 'Rejected'
- `session_head_name` (VARCHAR(100))
- `session_head_contact` (VARCHAR(20))
- `session_head_email` (VARCHAR(100))
- `reviewedby` (INT)
- `reviewdate` (TIMESTAMP)

## New API Endpoints

### For Institutions:

1. **GET `/organization/events/available`**
   - Get all available events (not yet booked)
   - Returns: Array of available events

2. **POST `/organization/events/request`**
   - Create a booking request for an event
   - Body: `{ eventId, participants, sessionHeadName, sessionHeadContact, sessionHeadEmail, postToCommunity }`
   - Returns: Created booking request

3. **GET `/organization/events/organization/:organizationId`**
   - Get all bookings for an organization
   - Returns: Array of booking requests

### For Admins:

4. **GET `/organization/events/requests`**
   - Get all booking requests (all statuses)
   - Returns: Array of booking requests with event and organization details

5. **GET `/organization/events/requests/:bookingId`**
   - Get a specific booking request by ID
   - Returns: Booking request details

6. **PUT `/organization/events/requests/:bookingId/approve`**
   - Approve a booking request
   - Body (optional): `{ postToCommunity: true/false }`
   - Automatically:
     - Updates booking status to 'Approved'
     - Assigns organization to the event
     - Updates participant count
     - Calculates and updates volunteers needed
     - Optionally posts to community board

7. **PUT `/organization/events/requests/:bookingId/reject`**
   - Reject a booking request
   - Updates booking status to 'Rejected'

## Features Implemented

### 1. Institution Features ✅
- ✅ View available events created by admin
- ✅ Send booking request with session head information
- ✅ Automatic community board posting (when booking approved)
- ✅ Session head contact information (name, phone, email)

### 2. Admin Features ✅
- ✅ View all booking requests
- ✅ Approve/reject booking requests
- ✅ Manual delete events with no participants
- ✅ Auto-delete events with no participants (day before event)

### 3. Community Board Integration ✅
- ✅ Automatic post creation when booking is approved
- ✅ Post includes event details and session head contact info

### 4. Auto-Delete Functionality ✅
- ✅ Scheduled task to delete events with no participants
- ✅ Runs the day before the event date
- ✅ Located in `ScheduledTasks/autoDeleteEvents.js`
- ✅ Can be enabled in `app.js` or run manually

## Files Created/Modified

### New Files:
- `MIGRATION_eventbookings_update.sql` - Database migration script
- `ScheduledTasks/autoDeleteEvents.js` - Auto-delete scheduled task
- `IMPLEMENTATION_SUMMARY.md` - This file

### Modified Files:
- `Models/EventBookingModel.js` - Complete rewrite with new functions
- `Controllers/EventBookingController.js` - Complete rewrite with new endpoints
- `Routes/EventBookingRoutes.js` - Updated with new routes
- `Models/Admin_event_Model.js` - Updated delete functionality
- `Controllers/Admin_event_Controller.js` - Updated delete message
- `app.js` - Added auto-delete task scheduling (commented out)

## Usage Instructions

### For Institutions:
1. View available events: `GET /organization/events/available`
2. Request to book: `POST /organization/events/request` with booking details
3. View bookings: `GET /organization/events/organization/:organizationId`

### For Admins:
1. View booking requests: `GET /organization/events/requests`
2. Approve booking: `PUT /organization/events/requests/:bookingId/approve`
3. Reject booking: `PUT /organization/events/requests/:bookingId/reject`
4. Delete events (manual): Existing delete endpoint already checks for participants

### Enabling Auto-Delete:
1. Uncomment the `runDaily()` call in `app.js`
2. Or run manually: `node ScheduledTasks/autoDeleteEvents.js`
3. Or set up a cron job to run the script daily

## Notes

- All endpoints require authentication (`authenticate` middleware)
- Session head information is optional but recommended
- Community board posting happens automatically unless `postToCommunity: false` is sent
- Auto-delete runs the day before events (checks events 1-2 days in the future)
- Events must have no participants (peoplesignup = 0) to be auto-deleted

