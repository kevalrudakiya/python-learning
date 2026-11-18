# Logical operators in Python

print("Logical Operators Example")
print("========================")

# AND: both conditions must be True
print("AND example:")
print(True and True)    # True
print(True and False)   # False
print(False and True)   # False
print(False and False)  # False

# OR: at least one condition must be True
print("\nOR example:")
print(True or True)     # True
print(True or False)    # True
print(False or True)    # True
print(False or False)   # False

# NOT: reverses the condition
print("\nNOT example:")
print(not True)         # False
print(not False)        # True

# Example with variables
age = 20
marks = 75

print("\nUsing variables:")
print(age >= 18 and marks >= 60)  # True
print(age >= 18 and marks < 60)   # False
print(age >= 18 or marks < 60)    # True
print(not(age >= 18))             # False
