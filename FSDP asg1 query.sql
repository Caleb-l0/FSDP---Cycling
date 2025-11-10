

CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL
);


CREATE TABLE Organizations (
    OrganizationID INT IDENTITY(1,1) PRIMARY KEY,
    OrgName NVARCHAR(100) NOT NULL,
    OrgDescription NVARCHAR(500),
    ContactEmail NVARCHAR(100),
    ContactPhone NVARCHAR(20),
    CreatedAt DATETIME DEFAULT GETDATE(),
);



CREATE TABLE VolunteerRequests (
    RequestID INT IDENTITY(1,1) PRIMARY KEY,
    OrganizationID INT NOT NULL,
    RequesterID INT NULL,
    EventName NVARCHAR(100) NOT NULL,
    EventDate DATETIME NOT NULL,
    Description NVARCHAR(MAX),
    RequiredVolunteers INT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Pending',
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    ReviewedBy INT NULL,
    ReviewDate DATETIME NULL,
    ReviewComments NVARCHAR(500),

    
    CONSTRAINT FK_VolunteerRequests_Organizations FOREIGN KEY (OrganizationID)
        REFERENCES Organizations(OrganizationID),

    CONSTRAINT FK_VolunteerRequests_Users FOREIGN KEY (RequesterID)
        REFERENCES Users(UserID)
);


