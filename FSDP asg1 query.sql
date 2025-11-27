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
VALUES (8, 100, 'Signup bonus');


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
    PostID INT PRIMARY KEY IDENTITY,
    UserID INT NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    PhotoURL NVARCHAR(255),

    CreatedAt DATETIME DEFAULT GETDATE(),

    Visibility VARCHAR(20) NOT NULL
        CONSTRAINT CHK_Visibility CHECK (Visibility IN ('public', 'friends', 'private'))
        DEFAULT 'public',

    TaggedInstitutionID INT NULL,

    FOREIGN KEY (UserID) REFERENCES Users(id),
    FOREIGN KEY (TaggedInstitutionID) REFERENCES Organizations(OrganizationID)
);

ALTER TABLE CommunityPosts
ADD LikeCount INT NOT NULL DEFAULT 0;

--- like

CREATE TABLE CommunityLikes (
    LikeID INT PRIMARY KEY IDENTITY,
    PostID INT NOT NULL,
    UserID INT NOT NULL,
    LikedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_CommunityLikes_Posts
        FOREIGN KEY (PostID) REFERENCES CommunityPosts(PostID)
        ON DELETE CASCADE,

    CONSTRAINT FK_CommunityLikes_Users
        FOREIGN KEY (UserID) REFERENCES Users(id)
        ON DELETE CASCADE,

    -- Ensure 1 user can like each post only once
    CONSTRAINT UQ_Post_User UNIQUE(PostID, UserID)
);





CREATE TABLE CommunityComments (
    CommentID INT PRIMARY KEY IDENTITY,         -- Unique Comment ID

    PostID INT NOT NULL,                        -- Which post this comment belongs to
    UserID INT NOT NULL,                        -- Who wrote the comment

    CommentText NVARCHAR(MAX) NOT NULL,         -- Content of the comment
    CreatedAt DATETIME DEFAULT GETDATE(),       -- When the comment was created

    -- Foreign keys
    CONSTRAINT FK_CommunityComments_Posts
        FOREIGN KEY (PostID) REFERENCES CommunityPosts(PostID)
        ON DELETE CASCADE,                     -- Delete comment if post is deleted

    CONSTRAINT FK_CommunityComments_Users
        FOREIGN KEY (UserID) REFERENCES Users(id)
        ON DELETE CASCADE                      -- Delete comment if user account deleted
);