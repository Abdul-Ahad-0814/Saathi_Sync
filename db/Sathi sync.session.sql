
CREATE TABLE users (
    UserID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    University VARCHAR(150),
    Role VARCHAR(10) CHECK (Role IN ('Student', 'Admin')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subjects (
    SubjectID SERIAL PRIMARY KEY,
    SubjectName VARCHAR(100) NOT NULL
);

CREATE TABLE usersubjects (
    UserID INT REFERENCES users(UserID) ON DELETE CASCADE,
    SubjectID INT REFERENCES subjects(SubjectID) ON DELETE CASCADE,
    PRIMARY KEY (UserID, SubjectID)
);

CREATE TABLE studygroups (
    GroupID SERIAL PRIMARY KEY,
    GroupName VARCHAR(100) NOT NULL,
    SubjectID INT REFERENCES subjects(SubjectID),
    CreatedBy INT REFERENCES users(UserID),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE groupmembers (
    GroupID INT REFERENCES studygroups(GroupID) ON DELETE CASCADE,
    UserID INT REFERENCES users(UserID) ON DELETE CASCADE,
    JoinDate DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (GroupID, UserID)
);

CREATE TABLE deadlines (
    DeadlineID SERIAL PRIMARY KEY,
    UserID INT REFERENCES users(UserID) ON DELETE CASCADE,
    Title VARCHAR(150) NOT NULL,
    SubjectID INT REFERENCES subjects(SubjectID),
    DueDate DATE NOT NULL,
    Priority VARCHAR(10) CHECK (Priority IN ('Low', 'Medium', 'High')),
    Status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE resources (
    ResourceID SERIAL PRIMARY KEY,
    Title VARCHAR(150) NOT NULL,
    SubjectID INT REFERENCES subjects(SubjectID),
    Type VARCHAR(20) CHECK (Type IN ('Notes', 'PastPaper')),
    UploadedBy INT REFERENCES users(UserID),
    FilePath VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookmarks (
    BookmarkID SERIAL PRIMARY KEY,
    UserID INT NOT NULL REFERENCES users(UserID) ON DELETE CASCADE,
    ResourceID INT NOT NULL REFERENCES resources(ResourceID) ON DELETE CASCADE,
    SavedTopic VARCHAR(150),
    UNIQUE (UserID, ResourceID),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
    BookID SERIAL PRIMARY KEY,
    Title VARCHAR(150) NOT NULL,
    Author VARCHAR(100),
    SubjectID INT REFERENCES subjects(SubjectID),
    IsAvailable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE studysessions (
    SessionID SERIAL PRIMARY KEY,
    UserID INT NOT NULL REFERENCES users(UserID) ON DELETE CASCADE,
    SubjectID INT REFERENCES subjects(SubjectID),
    DurationMinutes INT,
    TopicCovered VARCHAR(200),
    SessionDate DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit table for logging changes
CREATE TABLE auditlog (
    AuditID SERIAL PRIMARY KEY,
    TableName VARCHAR(50) NOT NULL,
    Operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    OldData JSONB,
    NewData JSONB,
    ChangedBy INT REFERENCES users(UserID),
    ChangedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PL/pgSQL function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PL/pgSQL function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_row JSONB;
    new_row JSONB;
    user_id INT;
BEGIN
    -- Get current user if available (assuming session variable or something, but for simplicity, set to NULL)
    user_id := NULL; -- In real app, set from session

    IF TG_OP = 'DELETE' THEN
        old_row := row_to_json(OLD)::JSONB;
        INSERT INTO auditlog (TableName, Operation, OldData, ChangedBy)
        VALUES (TG_TABLE_NAME, TG_OP, old_row, user_id);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        old_row := row_to_json(OLD)::JSONB;
        new_row := row_to_json(NEW)::JSONB;
        INSERT INTO auditlog (TableName, Operation, OldData, NewData, ChangedBy)
        VALUES (TG_TABLE_NAME, TG_OP, old_row, new_row, user_id);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        new_row := row_to_json(NEW)::JSONB;
        INSERT INTO auditlog (TableName, Operation, NewData, ChangedBy)
        VALUES (TG_TABLE_NAME, TG_OP, new_row, user_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_studygroups_updated_at
    BEFORE UPDATE ON studygroups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_deadlines_updated_at
    BEFORE UPDATE ON deadlines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookmarks_updated_at
    BEFORE UPDATE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_studysessions_updated_at
    BEFORE UPDATE ON studysessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Audit triggers
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_studygroups
    AFTER INSERT OR UPDATE OR DELETE ON studygroups
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_deadlines
    AFTER INSERT OR UPDATE OR DELETE ON deadlines
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_resources
    AFTER INSERT OR UPDATE OR DELETE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_bookmarks
    AFTER INSERT OR UPDATE OR DELETE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_books
    AFTER INSERT OR UPDATE OR DELETE ON books
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_studysessions
    AFTER INSERT OR UPDATE OR DELETE ON studysessions
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();
