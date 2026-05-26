from app import app, db

with app.app_context():
    try:
        db.session.execute(db.text("ALTER TABLE product ADD COLUMN length VARCHAR(50)"))
    except Exception as e:
        print("length column:", e)

    try:
        db.session.execute(db.text("ALTER TABLE product ADD COLUMN density VARCHAR(50)"))
    except Exception as e:
        print("density column:", e)

    try:
        db.session.execute(db.text("ALTER TABLE product ADD COLUMN lace_type VARCHAR(80)"))
    except Exception as e:
        print("lace_type column:", e)

    try:
        db.session.execute(db.text("ALTER TABLE product ADD COLUMN brand VARCHAR(120)"))
    except Exception as e:
        print("brand column:", e)

    for table, column, definition in [
        ("coupons", "expiry_date", "DATETIME"),
        ("coupons", "usage_limit", "INTEGER"),
        ("reviews", "is_approved", "BOOLEAN DEFAULT 0"),
    ]:
        try:
            db.session.execute(db.text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
        except Exception as e:
            print(f"{table}.{column} column:", e)

    db.session.commit()
    print("Product spec columns checked/added ✅")
