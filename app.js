const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/mern-machine-test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));


const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true }
});


userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }


  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);


app.use(express.json());

app.post('/signup', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
   
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

let users = [{ username: 'admin', password: 'admin123' }];
let employees = [
  { id: 1, name: 'John Doe', email: 'john@example.com', mobile: '1234567890', designation: 'HR', gender: 'M', course: ['MCA'], img: '', isActive: true, date: new Date() }
];

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    return res.status(200).json({ message: 'Login successful' });
  } else {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/employees', (req, res) => {
  const { search, page = 1, limit = 10, sortBy = 'name', sortDirection = 'asc' } = req.query;

  let filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(search?.toLowerCase() || '') ||
    emp.email.toLowerCase().includes(search?.toLowerCase() || '')
  );

 
  filteredEmployees = filteredEmployees.sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortBy] > b[sortBy]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });


  const startIndex = (page - 1) * limit;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + limit);

  res.json({ employees: paginatedEmployees, total: filteredEmployees.length });
});


app.post('/api/employees', (req, res) => {
  const { name, email, mobile, designation, gender, course, img } = req.body;

  if (employees.some(emp => emp.email === email)) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  const newEmployee = {
    id: employees.length + 1,
    name,
    email,
    mobile,
    designation,
    gender,
    course,
    img,
    isActive: true,
    date: new Date()
  };
  employees.push(newEmployee);

  return res.status(201).json({ message: 'Employee created successfully', employee: newEmployee });
});


app.put('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, designation, gender, course, img, isActive } = req.body;
  const employee = employees.find(emp => emp.id === parseInt(id));

  if (employee) {
    employee.name = name;
    employee.email = email;
    employee.mobile = mobile;
    employee.designation = designation;
    employee.gender = gender;
    employee.course = course;
    employee.img = img;
    employee.isActive = isActive;

    res.json({ message: 'Employee updated successfully', employee });
  } else {
    res.status(404).json({ message: 'Employee not found' });
  }
});


app.delete('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  employees = employees.filter(emp => emp.id !== parseInt(id));
  res.json({ message: 'Employee deleted successfully' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
