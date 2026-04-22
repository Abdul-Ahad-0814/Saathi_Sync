
CREATE TABLE Users (
    UserID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    University VARCHAR(150),
    Role VARCHAR(10) CHECK (Role IN ('Student', 'Admin')) NOT NULL
);

CREATE TABLE Subjects (
    SubjectID SERIAL PRIMARY KEY,
    SubjectName VARCHAR(100) NOT NULL
);

CREATE TABLE UserSubjects (
    UserID INT REFERENCES Users(UserID) ON DELETE CASCADE,
    SubjectID INT REFERENCES Subjects(SubjectID) ON DELETE CASCADE,
    PRIMARY KEY (UserID, SubjectID)
);

CREATE TABLE StudyGroups (
    GroupID SERIAL PRIMARY KEY,
    GroupName VARCHAR(100) NOT NULL,
    SubjectID INT REFERENCES Subjects(SubjectID),
    CreatedBy INT REFERENCES Users(UserID)
);

CREATE TABLE GroupMembers (
    GroupID INT REFERENCES StudyGroups(GroupID) ON DELETE CASCADE,
    UserID INT REFERENCES Users(UserID) ON DELETE CASCADE,
    JoinDate DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (GroupID, UserID)
);

CREATE TABLE Deadlines (
    DeadlineID SERIAL PRIMARY KEY,
    UserID INT REFERENCES Users(UserID) ON DELETE CASCADE,
    Title VARCHAR(150) NOT NULL,
    SubjectID INT REFERENCES Subjects(SubjectID),
    DueDate DATE NOT NULL,
    Priority VARCHAR(10) CHECK (Priority IN ('Low', 'Medium', 'High'))
);

CREATE TABLE Resources (
    ResourceID SERIAL PRIMARY KEY,
    Title VARCHAR(150) NOT NULL,
    SubjectID INT REFERENCES Subjects(SubjectID),
    Type VARCHAR(20) CHECK (Type IN ('Notes', 'PastPaper')),
    UploadedBy INT REFERENCES Users(UserID),
    FilePath VARCHAR(255)
);

CREATE TABLE Bookmarks (
    BookmarkID SERIAL PRIMARY KEY,
    UserID INT NOT NULL REFERENCES Users(UserID) ON DELETE CASCADE,
    ResourceID INT NOT NULL REFERENCES Resources(ResourceID) ON DELETE CASCADE,
    SavedTopic VARCHAR(150),
    UNIQUE (UserID, ResourceID)
);

CREATE TABLE Books (
    BookID SERIAL PRIMARY KEY,
    Title VARCHAR(150) NOT NULL,
    Author VARCHAR(100),
    SubjectID INT REFERENCES Subjects(SubjectID),
    IsAvailable BOOLEAN DEFAULT TRUE
);

CREATE TABLE StudySessions (
    SessionID SERIAL PRIMARY KEY,
    UserID INT NOT NULL REFERENCES Users(UserID) ON DELETE CASCADE,
    SubjectID INT REFERENCES Subjects(SubjectID),
    DurationMinutes INT,
    TopicCovered VARCHAR(200),
    SessionDate DATE DEFAULT CURRENT_DATE
);


