class Deadline:
    def __init__(self, id=None, title=None, date=None, user_id=None, created_at=None):
        self.id = id
        self.title = title
        self.date = date
        self.user_id = user_id
        self.created_at = created_at

    @staticmethod
    def create_deadline(db, title, date, user_id):
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO deadlines (title, date, user_id) VALUES (?, ?, ?)",
            (title, date, user_id)
        )
        db.commit()
        return cursor.lastrowid

    @staticmethod
    def get_deadlines_by_user(db, user_id):
        cursor = db.cursor()
        cursor.execute("SELECT * FROM deadlines WHERE user_id = ? ORDER BY date", (user_id,))
        rows = cursor.fetchall()
        return [{'id': row[0], 'title': row[1], 'date': row[2], 'user_id': row[3], 'created_at': row[4]} for row in rows]

    @staticmethod
    def delete_deadline(db, deadline_id, user_id):
        cursor = db.cursor()
        cursor.execute("DELETE FROM deadlines WHERE id = ? AND user_id = ?", (deadline_id, user_id))
        db.commit()
        return cursor.rowcount > 0