-- ===========================
-- 1. DROP ALL FOREIGN KEYS SAFELY
-- ===========================
DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql = @sql + '
ALTER TABLE [' + OBJECT_SCHEMA_NAME(parent_object_id) + '].[' + OBJECT_NAME(parent_object_id) + '] 
DROP CONSTRAINT [' + name + '];'
FROM sys.foreign_keys;

EXEC sp_executesql @sql;


-- ===========================
-- 2. DROP ALL TABLES SAFELY
-- ===========================
SET @sql = N'';

SELECT @sql = @sql + '
DROP TABLE IF EXISTS [' + TABLE_SCHEMA + '].[' + TABLE_NAME + '];'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';

EXEC sp_executesql @sql;




CREATE TABLE Users (
  id INT PRIMARY KEY IDENTITY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(100)
);    ALTER TABLE Users
ADD role VARCHAR(50) DEFAULT 'user';


CREATE TABLE Organizations (
    OrganizationID INT IDENTITY(1,1) PRIMARY KEY,
    OrgName NVARCHAR(100) NOT NULL,
    OrgDescription NVARCHAR(500),
    ContactEmail NVARCHAR(100),
    ContactPhone NVARCHAR(20),
    CreatedAt DATETIME DEFAULT GETDATE(),
);

CREATE TABLE UserOrganizations (
    UserOrgID INT IDENTITY(1,1) PRIMARY KEY,    
    UserID INT NOT NULL,                        
    OrganizationID INT NOT NULL,                
    OrgEmail NVARCHAR(100),                      
    OrgRole NVARCHAR(50) DEFAULT 'member',       
    JoinedAt DATETIME DEFAULT GETDATE(),         

    CONSTRAINT FK_UserOrganizations_Users
        FOREIGN KEY (UserID) REFERENCES Users(id)
        ON DELETE CASCADE,

    CONSTRAINT FK_UserOrganizations_Organizations
        FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID)
        ON DELETE CASCADE
);




CREATE TABLE Events (
    EventID INT PRIMARY KEY IDENTITY,
    Location NVARCHAR(MAX),
    MaximumParticipant INT NOT Null,
    OrganizationID INT,
    EventName NVARCHAR(100) NOT NULL,
    EventDate DATETIME NOT NULL,
    Description NVARCHAR(MAX),
    RequiredVolunteers INT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Upcoming',   -- Upcoming / Ongoing / Completed / Cancelled
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    CONSTRAINT FK_Events_Organizations FOREIGN KEY (OrganizationID)
        REFERENCES Organizations(OrganizationID)
);



CREATE TABLE VolunteerRequests (
    RequestID INT IDENTITY(1,1) PRIMARY KEY,
    OrganizationID INT NOT NULL,
    RequesterID INT NULL,
    EventID INT NOT NULL,
    EventName NVARCHAR(100) NOT NULL,
    EventDate DATETIME NOT NULL,
    Description NVARCHAR(MAX),
    RequiredVolunteers INT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Outdated, Rejected
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    ReviewedBy INT NULL,
    ReviewDate DATETIME NULL,
    ReviewComments NVARCHAR(500),

    
    CONSTRAINT FK_VolunteerRequests_Organizations FOREIGN KEY (OrganizationID)
        REFERENCES Organizations(OrganizationID),

    CONSTRAINT FK_VolunteerRequests_Events FOREIGN KEY (EventID)
        REFERENCES Events(EventID)
);






CREATE TABLE EventSignUps (
    SignUpID INT PRIMARY KEY IDENTITY,
    EventID INT NOT NULL,
    UserID INT NOT NULL,
    SignUpDate DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'Active',     -- Active / Cancelled / Completed

    CONSTRAINT FK_EventSignUps_Events FOREIGN KEY (EventID)
        REFERENCES Events(EventID),

    CONSTRAINT FK_EventSignUps_Users FOREIGN KEY (UserID)
        REFERENCES Users(id)
);


CREATE TABLE UserEvents (
    UserEventID INT PRIMARY KEY IDENTITY,
    UserID INT NOT NULL,
    EventID INT NOT NULL,
    SignUpDate DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_UserEvents_Users FOREIGN KEY (UserID)
        REFERENCES Users(id),

    CONSTRAINT FK_UserEvents_Events FOREIGN KEY (EventID)
        REFERENCES Events(EventID)
);

/* Table to track who is booking, how many people are included in the booking and when it was booked for what event*/
CREATE TABLE EventBookings (
    BookingID INT PRIMARY KEY IDENTITY,
    EventID INT NOT NULL,
    OrganizationID INT NOT NULL,
    Participants INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_EventBookings_Events FOREIGN KEY (EventID)
        REFERENCES Events(EventID),

    CONSTRAINT FK_EventBookings_Organizations FOREIGN KEY (OrganizationID)
        REFERENCES Organizations(OrganizationID)
);


CREATE TABLE Rewards (
    id INT PRIMARY KEY IDENTITY,
    user_id INT NOT NULL,
    points INT NOT NULL,
    description VARCHAR(255),
    dateEarned DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

ALTER TABLE Rewards
ADD VoucherCode VARCHAR(50) NULL;


INSERT INTO Rewards (user_id, points, description)
VALUES (11, 100, 'Signup bonus');
//testing - use your own btw... id 11 happens to be my first volunnteer//

CREATE TABLE ShopItems (
    ItemID INT PRIMARY KEY IDENTITY,
    Name VARCHAR(255),
    Description VARCHAR(255),
    Cost INT
);

INSERT INTO ShopItems (Name, Description, Cost) VALUES
('$5 NTUC Voucher', '$5 grocery voucher from all NTUC outlets', 50),
('$10 NTUC Voucher', '$10 grocery voucher from all NTUC outlets', 100),
('Volunteer T-Shirt', 'Official Volunteer T-Shirt', 200);

--Volunteer Community Posts Table--
CREATE TABLE CommunityPosts (
  PostID INT PRIMARY KEY AUTO_INCREMENT,
  UserID INT NOT NULL,
  Content TEXT NOT NULL,
  PhotoURL VARCHAR(255),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- ===========================
-- MIGRATION SCRIPT: Update existing Events table if it exists
-- ===========================
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Events')
BEGIN
    -- Drop Location column if it exists
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'Location')
    BEGIN
        ALTER TABLE Events DROP COLUMN Location;
        PRINT 'Location column dropped successfully';
    END

    -- Add EventLocation column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'Location')
    BEGIN
        ALTER TABLE Events ADD Location NVARCHAR(MAX);
        PRINT 'Location column added successfully';
    END
    ELSE
    BEGIN
        PRINT 'EventLocation column already exists';
    END

    -- Drop PeopleSignUp column if it exists
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'PeopleSignUp')
    BEGIN
        ALTER TABLE Events DROP COLUMN PeopleSignUp;
        PRINT 'PeopleSignUp column dropped successfully';
    END

    -- Drop VolunteerSignUp column if it exists
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'VolunteerSignUp')
    BEGIN
        ALTER TABLE Events DROP COLUMN VolunteerSignUp;
        PRINT 'VolunteerSignUp column dropped successfully';
    END

    -- Drop MaximumParticipant column if it exists
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Events' AND COLUMN_NAME = 'MaximumParticipant')
    BEGIN
        ALTER TABLE Events DROP COLUMN MaximumParticipant;
        PRINT 'MaximumParticipant column dropped successfully';
    END
END

