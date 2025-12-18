import hashlib
import base64
import os

passwords = [
    ('Shipper@123', 'shipper@demo.com'),
    ('Broker@123', 'broker@demo.com'),
    ('Admin@123', 'admin@demo.com')
]

for pwd, email in passwords:
    salt = os.urandom(16)
    hash_obj = hashlib.pbkdf2_hmac('sha256', pwd.encode(), salt, 100000)
    salt_b64 = base64.b64encode(salt).decode()
    hash_b64 = base64.b64encode(hash_obj).decode()
    print(f'{email}:')
    print(f'  Password: {pwd}')
    print(f'  PasswordHash = "{salt_b64}:{hash_b64}"')
    print()
