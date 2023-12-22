# connection to store in the data base

import sqlite3

conn = sqlite3.connect('client_data.db')

c = conn.cursor()

#create table
c.execute("create table if not exists students(idno integer, sname text, course text)")

#insert records
c.execute("insert into students values(104, 'shwetha Sarabhai', 'C')")
c.execute("insert into students values(105, 'siri Dhawan', 'C++')")
c.execute("insert into students values(106, 'Bharathi Kalam', 'Python')")
print("3 records have been inserted successfully!")

conn.commit()

conn.close()
