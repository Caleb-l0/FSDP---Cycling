# Event Flow Analysis

## Your Intended Flow:
1. Admin creates event
2. Institution books the event
3. If booking is approved, event is posted to volunteer page
4. Volunteer can sign up

## Current Implementation Analysis:

### ✅ STEP 1: Admin Creates Event
- **Route**: `POST /admin/create_events`
- **Controller**: `Admin_event_Controller.createEvent()`
- **Model**: `Admin_event_Model.createEvent()`
- **Table**: `events`
- **Status**: ✅ WORKS - Event is created with `organizationid` (can be null)

### ❓ STEP 2: Institution Books Event  
**Two Possible Flows:**

#### Flow A: Organization Request (volunterrequests table)
- **Route**: `POST /request-event`
- **Controller**: `OrganizationRequestController.createRequest()`
- **Table**: `volunterrequests`
- **Purpose**: Institution requests admin to CREATE an event
- **Status**: Creates a REQUEST, not a booking

#### Flow B: Event Booking (eventbookings table)  
- **Route**: `POST /organization/events/request`
- **Controller**: `EventBookingController.createBookingRequest()`
- **Table**: `eventbookings`
- **Purpose**: Institution books an EXISTING event
- **Status**: Creates a booking request with status "Pending"

### ❌ STEP 3: Problem Identified!

**Current Issue**: When booking is approved, it:
- Updates `eventbookings.status` to "Approved"
- Updates `events.organizationid` (assigns organization to event)
- BUT: Volunteers see ALL events via `getAllEvents()`

**Route**: `GET /volunteer/events` → `adminEventController.getAllEvents()`

**Current Query**:
```sql
SELECT * FROM events ORDER BY eventid ASC
```

**Problem**: No filtering by:
- Booking approval status
- Organization assignment
- Event status

### ✅ STEP 4: Volunteer Signs Up
- **Route**: `POST /volunteer/events/signup/:eventID`
- **Controller**: `EventController.signup()`
- **Table**: `eventsignups`
- **Status**: ✅ WORKS

## Recommendations:

### Option 1: Filter Events for Volunteers (Recommended)
Only show events to volunteers that have:
- `organizationid` IS NOT NULL (assigned to an organization)
- OR have an approved booking

### Option 2: Add Status Field to Events
Add a `publishstatus` field to `events` table:
- "Draft" - Admin created, not yet approved
- "Pending" - Waiting for booking approval
- "Published" - Approved booking, visible to volunteers
- "Completed" - Event finished

### Option 3: Link Events to Bookings
Check if event has an approved booking before showing to volunteers.

