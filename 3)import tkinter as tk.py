import tkinter as tk

root = tk.Tk()
root.geometry("300x200")

# LABEL
tk.Label(root, text="Enter Name:").pack()

# ENTRY FIELD
name = tk.Entry(root)
name.pack()

# BUTTON + Function
def submit():
    print("Hello", name.get()) # get() takes text from entry

tk.Button(root, text="Submit", command=submit).pack()

root.mainloop()