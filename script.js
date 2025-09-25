// Global variables
let currentUser = null;
let currentGrade = null;
let students = JSON.parse(localStorage.getItem('students') || '[]');
let users = JSON.parse(localStorage.getItem('users') || '[]');
let exams = JSON.parse(localStorage.getItem('exams') || '[]');
let payments = JSON.parse(localStorage.getItem('payments') || '{}');
let clubs = JSON.parse(localStorage.getItem('clubs') || '[]');
let graduatedStudents = JSON.parse(localStorage.getItem('graduatedStudents') || '[]');
let resetCode = null;
let resetEmail = null;
let admissionCounter = parseInt(localStorage.getItem('admissionCounter') || '0');

// Theme management
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.querySelector('.theme-toggle i');
    themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    const themeIcon = document.querySelector('.theme-toggle i');
    themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function init() {
    loadTheme();
    loadSampleData();
    checkAuthentication();
    updateDashboardStats();
}

function checkAuthentication() {
    currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
        showHome();
        updateUserInfo();
    } else {
        showSignup();
    }
}

function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    if (currentUser) {
        userInfo.textContent = `${currentUser.fullName} (${currentUser.category})`;
        userInfo.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
    }
}

// Authentication functions
function signup(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const username = document.getElementById('username').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const category = document.getElementById('userCategory').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showAlert('Passwords do not match!', 'danger');
        return;
    }

    const existingUser = users.find(user => 
        user.username === username || user.email === email || user.phone === phone
    );

    if (existingUser) {
        showAlert('User with this username, email, or phone already exists!', 'danger');
        return;
    }

    const categoryCount = users.filter(user => user.category === category).length;
    if (['Admin', 'DoS_Social_Affairs', 'Finance'].includes(category) && categoryCount >= 2) {
        showAlert(`Maximum 2 users allowed for ${category} category!`, 'danger');
        return;
    }

    const newUser = {
        id: Date.now(),
        fullName,
        username,
        phone,
        email,
        category,
        password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    showAlert('Account created successfully!', 'success');
    setTimeout(() => showLogin(), 2000);
}

function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showHome();
        updateUserInfo();
        showAlert('Login successful!', 'success');
    } else {
        showAlert('Invalid username or password!', 'danger');
    }
}

function forgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    const user = users.find(u => u.email === email);

    if (user) {
        resetCode = Math.floor(1000 + Math.random() * 9000).toString();
        resetEmail = email;
        
        console.log(`Reset code for ${email}: ${resetCode}`);
        showAlert(`Reset code sent to ${email}. Check console for code: ${resetCode}`, 'success');
        
        setTimeout(() => showResetPassword(), 2000);
    } else {
        showAlert('Email not found!', 'danger');
    }
}

function resetPassword(event) {
    event.preventDefault();
    
    const code = document.getElementById('resetCode').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (code !== resetCode) {
        showAlert('Invalid reset code!', 'danger');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showAlert('Passwords do not match!', 'danger');
        return;
    }

    const userIndex = users.findIndex(u => u.email === resetEmail);
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
        
        showAlert('Password reset successful!', 'success');
        setTimeout(() => showLogin(), 2000);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showSignup();
    document.getElementById('userInfo').classList.add('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
}

// Navigation functions
function showSignup() {
    hideAllSections();
    document.getElementById('signupForm').classList.remove('hidden');
}

function showLogin() {
    hideAllSections();
    document.getElementById('loginForm').classList.remove('hidden');
}

function showForgotPassword() {
    hideAllSections();
    document.getElementById('forgotPasswordForm').classList.remove('hidden');
}

function showResetPassword() {
    hideAllSections();
    document.getElementById('resetPasswordForm').classList.remove('hidden');
}

function showHome() {
    hideAllSections();
    document.getElementById('homePage').classList.remove('hidden');
    updateDashboardStats();
}

function hideAllSections() {
    const sections = ['signupForm', 'loginForm', 'forgotPasswordForm', 'resetPasswordForm', 
                     'homePage', 'gradePage', 'addStudentForm', 'accountSettings'];
    sections.forEach(section => {
        document.getElementById(section).classList.add('hidden');
    });
}

// Student management
function showAddStudent() {
    hideAllSections();
    document.getElementById('addStudentForm').classList.remove('hidden');
}

function addStudent(event) {
    event.preventDefault();
    
    const name = document.getElementById('studentName').value;
    const gender = document.getElementById('studentGender').value;
    const age = parseInt(document.getElementById('studentAge').value);
    const grade = parseInt(document.getElementById('studentGrade').value);
    const photoFile = document.getElementById('studentPhoto').files[0];

    admissionCounter++;
    const admissionNumber = admissionCounter.toString().padStart(3, '0');
    
    const newStudent = {
        id: Date.now(),
        admissionNumber,
        name,
        gender,
        age,
        grade,
        photo: null,
        addedDate: new Date().toISOString(),
        exams: {},
        payments: {},
        clubs: []
    };

    if (photoFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            newStudent.photo = e.target.result;
            saveStudent(newStudent);
        };
        reader.readAsDataURL(photoFile);
    } else {
        saveStudent(newStudent);
    }
}

function saveStudent(student) {
    students.push(student);
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('admissionCounter', admissionCounter.toString());
    
    showAlert('Student added successfully!', 'success');
    document.getElementById('addStudentForm').querySelector('form').reset();
    setTimeout(() => showHome(), 2000);
}

function showGrade(grade) {
    currentGrade = grade;
    hideAllSections();
    document.getElementById('gradePage').classList.remove('hidden');
    document.getElementById('gradeTitle').innerHTML = `<i class="fas fa-users"></i> Grade ${grade} Students`;
    
    const gradeStudents = students.filter(s => s.grade === grade);
    const tableBody = document.getElementById('studentsTableBody');
    
    tableBody.innerHTML = gradeStudents.map(student => `
        <tr>
            <td><a href="#" onclick="showStudentDetails('${student.id}')" style="color: var(--primary-color); text-decoration: none;">${student.admissionNumber}</a></td>
            <td><a href="#" onclick="showStudentDetails('${student.id}')" style="color: var(--primary-color); text-decoration: none;">${student.name}</a></td>
            <td>${student.gender}</td>
            <td>${student.age}</td>
            <td>
                <button class="btn btn-info" onclick="showExamOptions('${student.id}')">
                    <i class="fas fa-clipboard"></i> Exam
                </button>
                <button class="btn btn-warning" onclick="recordPayment('${student.id}')">
                    <i class="fas fa-money-bill"></i> Payment
                </button>
                <button class="btn btn-success" onclick="promoteStudent('${student.id}')">
                    <i class="fas fa-arrow-up"></i> Promote
                </button>
                ${hasPermission(['Admin']) ? `
                    <button class="btn btn-primary" onclick="editStudent('${student.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteStudent('${student.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function promoteStudent(studentId) {
    const student = students.find(s => s.id == studentId);
    if (!student) return;

    if (student.grade === 9) {
        const graduatedStudent = {
            ...student,
            graduationYear: new Date().getFullYear(),
            graduationDate: new Date().toISOString()
        };
        
        graduatedStudents.push(graduatedStudent);
        students = students.filter(s => s.id != studentId);
        
        localStorage.setItem('graduatedStudents', JSON.stringify(graduatedStudents));
        localStorage.setItem('students', JSON.stringify(students));
        
        showAlert(`${student.name} graduated successfully!`, 'success');
    } else {
        student.grade++;
        localStorage.setItem('students', JSON.stringify(students));
        showAlert(`${student.name} promoted to Grade ${student.grade}!`, 'success');
    }
    
    showGrade(currentGrade);
}

function editStudent(studentId) {
    const student = students.find(s => s.id == studentId);
    if (!student) return;

    const modal = createModal('Edit Student', `
        <form onsubmit="updateStudent(event, '${studentId}')">
            <div class="form-group">
                <label>Name</label>
                <input type="text" class="form-control" id="editName" value="${student.name}" required>
            </div>
            <div class="form-group">
                <label>Gender</label>
                <select class="form-control" id="editGender" required>
                    <option value="M" ${student.gender === 'M' ? 'selected' : ''}>Male</option>
                    <option value="F" ${student.gender === 'F' ? 'selected' : ''}>Female</option>
                </select>
            </div>
            <div class="form-group">
                <label>Age</label>
                <input type="number" class="form-control" id="editAge" value="${student.age}" required>
            </div>
            <div class="form-group">
                <label>Grade</label>
                <select class="form-control" id="editGrade" required>
                    <option value="7" ${student.grade === 7 ? 'selected' : ''}>Grade 7</option>
                    <option value="8" ${student.grade === 8 ? 'selected' : ''}>Grade 8</option>
                    <option value="9" ${student.grade === 9 ? 'selected' : ''}>Grade 9</option>
                </select>
            </div>
            <button type="submit" class="btn btn-success">Update Student</button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        </form>
    `);
}

function updateStudent(event, studentId) {
    event.preventDefault();
    
    const studentIndex = students.findIndex(s => s.id == studentId);
    if (studentIndex === -1) return;

    students[studentIndex].name = document.getElementById('editName').value;
    students[studentIndex].gender = document.getElementById('editGender').value;
    students[studentIndex].age = parseInt(document.getElementById('editAge').value);
    students[studentIndex].grade = parseInt(document.getElementById('editGrade').value);

    localStorage.setItem('students', JSON.stringify(students));
    showAlert('Student updated successfully!', 'success');
    closeModal();
    showGrade(currentGrade);
}

function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        students = students.filter(s => s.id != studentId);
        localStorage.setItem('students', JSON.stringify(students));
        showAlert('Student deleted successfully!', 'success');
        showGrade(currentGrade);
    }
}

// Exam management
function showExamSection() {
    const modal = createModal('Exam Management', `
        <div style="margin-bottom: 20px;">
            <button class="btn btn-success" onclick="addExam()">
                <i class="fas fa-plus"></i> Add Exam
            </button>
            <button class="btn btn-info" onclick="viewExams()">
                <i class="fas fa-eye"></i> View Exams
            </button>
        </div>
        <div id="examContent"></div>
    `, 'large');
}

function addExam() {
    const examContent = document.getElementById('examContent');
    examContent.innerHTML = `
        <h4>Add New Exam</h4>
        <form onsubmit="saveExam(event)">
            <div class="form-group">
                <label>Exam Name</label>
                <input type="text" class="form-control" id="examName" required>
            </div>
            <div class="form-group">
                <label>Grade</label>
                <select class="form-control" id="examGrade" required>
                    <option value="">Select Grade</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                </select>
            </div>
            <div class="form-group">
                <label>Term</label>
                <select class="form-control" id="examTerm" required>
                    <option value="">Select Term</option>
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                    <option value="3">Term 3</option>
                </select>
            </div>
            <div class="form-group">
                <label>Year</label>
                <input type="number" class="form-control" id="examYear" value="${new Date().getFullYear()}" required>
            </div>
            <button type="submit" class="btn btn-success">Create Exam</button>
        </form>
    `;
}

function saveExam(event) {
    event.preventDefault();
    
    const examName = document.getElementById('examName').value;
    const grade = parseInt(document.getElementById('examGrade').value);
    const term = parseInt(document.getElementById('examTerm').value);
    const year = parseInt(document.getElementById('examYear').value);

    const exam = {
        id: Date.now(),
        name: examName,
        grade,
        term,
        year,
        subjects: ['English', 'Kiswahili', 'Math', 'Integrated Science', 'CRE', 'Social Studies', 'Pre-technical Studies', 'Agriculture', 'C&A'],
        marks: {},
        createdDate: new Date().toISOString()
    };

    const gradeStudents = students.filter(s => s.grade === grade);
    gradeStudents.forEach(student => {
        exam.marks[student.id] = {};
        exam.subjects.forEach(subject => {
            exam.marks[student.id][subject] = 0;
        });
    });

    exams.push(exam);
    localStorage.setItem('exams', JSON.stringify(exams));
    
    showAlert('Exam created successfully!', 'success');
    showExamMarksEntry(exam.id);
}

function showExamMarksEntry(examId) {
    const exam = exams.find(e => e.id == examId);
    if (!exam) return;

    const gradeStudents = students.filter(s => s.grade === exam.grade);
    
    const examContent = document.getElementById('examContent');
    examContent.innerHTML = `
        <h4>${exam.name} - Grade ${exam.grade} - Term ${exam.term} ${exam.year}</h4>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Adm</th>
                        <th>Name</th>
                        ${exam.subjects.map(subject => `<th>${subject}</th>`).join('')}
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${gradeStudents.map(student => `
                        <tr>
                            <td>${student.admissionNumber}</td>
                            <td>${student.name}</td>
                            ${exam.subjects.map(subject => `
                                <td>
                                    <input type="number" class="form-control" 
                                           value="${exam.marks[student.id][subject] || 0}"
                                           onchange="updateMark('${examId}', '${student.id}', '${subject}', this.value)"
                                           min="0" max="100" style="width: 80px;">
                                </td>
                            `).join('')}
                            <td id="total_${student.id}">${calculateTotal(exam.marks[student.id])}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top: 20px;">
            <button class="btn btn-success" onclick="saveExamMarks('${examId}')">
                <i class="fas fa-save"></i> Save Marks
            </button>
            <button class="btn btn-info" onclick="exportExamToExcel('${examId}')">
                <i class="fas fa-download"></i> Export to Excel
            </button>
        </div>
    `;
}

function updateMark(examId, studentId, subject, value) {
    const exam = exams.find(e => e.id == examId);
    if (exam) {
        exam.marks[studentId][subject] = parseInt(value) || 0;
        document.getElementById(`total_${studentId}`).textContent = calculateTotal(exam.marks[studentId]);
    }
}

function calculateTotal(marks) {
    return Object.values(marks).reduce((sum, mark) => sum + (parseInt(mark) || 0), 0);
}

function saveExamMarks(examId) {
    localStorage.setItem('exams', JSON.stringify(exams));
    showAlert('Exam marks saved successfully!', 'success');
}

function viewExams() {
    const examContent = document.getElementById('examContent');
    examContent.innerHTML = `
        <h4>All Exams</h4>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Exam Name</th>
                        <th>Grade</th>
                        <th>Term</th>
                        <th>Year</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${exams.map(exam => `
                        <tr>
                            <td>${exam.name}</td>
                            <td>Grade ${exam.grade}</td>
                            <td>Term ${exam.term}</td>
                            <td>${exam.year}</td>
                            <td>
                                <button class="btn btn-info" onclick="showExamMarksEntry('${exam.id}')">
                                    <i class="fas fa-edit"></i> Edit Marks
                                </button>
                                <button class="btn btn-success" onclick="exportExamToExcel('${exam.id}')">
                                    <i class="fas fa-download"></i> Export
                                </button>
                                ${hasPermission(['Admin', 'DoS_Exam']) ? `
                                    <button class="btn btn-danger" onclick="deleteExam('${exam.id}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function deleteExam(examId) {
    if (confirm('Are you sure you want to delete this exam?')) {
        exams = exams.filter(e => e.id != examId);
        localStorage.setItem('exams', JSON.stringify(exams));
        showAlert('Exam deleted successfully!', 'success');
        viewExams();
    }
}

// Payment management
function showPaymentSection() {
    if (!hasPermission(['Admin', 'Finance', 'DoS_Social_Affairs'])) {
        showAlert('You do not have permission to access payments!', 'danger');
        return;
    }

    const modal = createModal('Payment Management', `
        <div style="margin-bottom: 20px;">
            <button class="btn btn-success" onclick="showAddFeeType()">
                <i class="fas fa-plus"></i> Add Fee Type
            </button>
            <button class="btn btn-info" onclick="showPaymentDashboard()">
                <i class="fas fa-chart-bar"></i> Payment Dashboard
            </button>
        </div>
        <div id="paymentContent"></div>
    `, 'large');
}

function showAddFeeType() {
    const paymentContent = document.getElementById('paymentContent');
    paymentContent.innerHTML = `
        <h4>Add Fee Type</h4>
        <form onsubmit="addFeeType(event)">
            <div class="form-group">
                <label>Fee Type Name</label>
                <input type="text" class="form-control" id="feeTypeName" required>
            </div>
            <div class="form-group">
                <label>Amount</label>
                <input type="number" class="form-control" id="feeAmount" step="0.01" required>
            </div>
            <div class="form-group">
                <label>Apply to Grade</label>
                <select class="form-control" id="feeGrade" required>
                    <option value="">Select Grade</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="all">All Grades</option>
                </select>
            </div>
            <div class="form-group">
                <label>Term</label>
                <select class="form-control" id="feeTerm" required>
                    <option value="">Select Term</option>
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                    <option value="3">Term 3</option>
                </select>
            </div>
            <button type="submit" class="btn btn-success">Add Fee Type</button>
        </form>
    `;
}

function addFeeType(event) {
    event.preventDefault();
    
    const feeTypeName = document.getElementById('feeTypeName').value;
    const amount = parseFloat(document.getElementById('feeAmount').value);
    const grade = document.getElementById('feeGrade').value;
    const term = parseInt(document.getElementById('feeTerm').value);

    const targetStudents = grade === 'all' ? students : students.filter(s => s.grade == grade);
    
    targetStudents.forEach(student => {
        if (!payments[student.id]) {
            payments[student.id] = {};
        }
        
        const feeKey = `${feeTypeName}_T${term}`;
        payments[student.id][feeKey] = {
            name: feeTypeName,
            amount: amount,
            paid: 0,
            term: term,
            year: new Date().getFullYear()
        };
    });

    localStorage.setItem('payments', JSON.stringify(payments));
    showAlert(`Fee type "${feeTypeName}" added successfully!`, 'success');
    showPaymentDashboard();
}

function showPaymentDashboard() {
    const paymentContent = document.getElementById('paymentContent');
    
    const dashboardHTML = `
        <h4>Payment Dashboard</h4>
        <div class="filter-container">
            <select class="form-control" id="paymentFilter" onchange="filterPayments()">
                <option value="all">All Students</option>
                <option value="0-25">0-25% Paid</option>
                <option value="26-50">26-50% Paid</option>
                <option value="51-75">51-75% Paid</option>
                <option value="76-99">76-99% Paid</option>
                <option value="100">Fully Paid</option>
            </select>
            <button class="btn btn-success" onclick="exportFeeReminders()">
                <i class="fas fa-download"></i> Export Filtered
            </button>
        </div>
        <div class="table-container" id="paymentTable">
            ${generatePaymentTable()}
        </div>
    `;
    
    paymentContent.innerHTML = dashboardHTML;
}

function generatePaymentTable() {
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Adm</th>
                    <th>Name</th>
                    <th>Grade</th>
                    <th>Fee Details</th>
                    <th>Payment %</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    students.forEach(student => {
        const studentPayments = payments[student.id] || {};
        const paymentDetails = Object.entries(studentPayments).map(([key, fee]) => {
            const percentage = fee.amount > 0 ? Math.round((fee.paid / fee.amount) * 100) : 0;
            return `${fee.name}: ${fee.paid}/${fee.amount} (${percentage}%)`;
        }).join('<br>');

        const totalAmount = Object.values(studentPayments).reduce((sum, fee) => sum + fee.amount, 0);
        const totalPaid = Object.values(studentPayments).reduce((sum, fee) => sum + fee.paid, 0);
        const overallPercentage = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

        tableHTML += `
            <tr data-percentage="${overallPercentage}">
                <td>${student.admissionNumber}</td>
                <td>${student.name}</td>
                <td>${student.grade}</td>
                <td>${paymentDetails || 'No fees assigned'}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${overallPercentage}%">${overallPercentage}%</div>
                    </div>
                </td>
                <td>
                    <button class="btn btn-success" onclick="recordPayment('${student.id}')">
                        <i class="fas fa-money-bill"></i> Record Payment
                    </button>
                </td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table>';
    return tableHTML;
}

function filterPayments() {
    const filter = document.getElementById('paymentFilter').value;
    const rows = document.querySelectorAll('#paymentTable tbody tr');

    rows.forEach(row => {
        const percentage = parseInt(row.dataset.percentage);
        let show = true;

        if (filter !== 'all') {
            if (filter === '0-25') show = percentage >= 0 && percentage <= 25;
            else if (filter === '26-50') show = percentage >= 26 && percentage <= 50;
            else if (filter === '51-75') show = percentage >= 51 && percentage <= 75;
            else if (filter === '76-99') show = percentage >= 76 && percentage <= 99;
            else if (filter === '100') show = percentage === 100;
        }

        row.style.display = show ? '' : 'none';
    });
}

function recordPayment(studentId) {
    const student = students.find(s => s.id == studentId);
    const studentPayments = payments[studentId] || {};

    const modal = createModal(`Record Payment - ${student.name}`, `
        <form onsubmit="savePayment(event, '${studentId}')">
            ${Object.entries(studentPayments).map(([key, fee]) => `
                <div class="form-group">
                    <label>${fee.name} (Amount: ${fee.amount}, Paid: ${fee.paid})</label>
                    <input type="number" class="form-control" name="${key}" 
                           value="${fee.paid}" min="0" max="${fee.amount}" step="0.01">
                </div>
            `).join('')}
            <button type="submit" class="btn btn-success">Update Payments</button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        </form>
    `);
}

function savePayment(event, studentId) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const studentPayments = payments[studentId];

    for (let [key, value] of formData) {
        if (studentPayments[key]) {
            studentPayments[key].paid = parseFloat(value);
        }
    }

    localStorage.setItem('payments', JSON.stringify(payments));
    showAlert('Payment updated successfully!', 'success');
    closeModal();
    showPaymentDashboard();
}

// Club management
function showClubSection() {
    const modal = createModal('Club Management', `
        <div style="margin-bottom: 20px;">
            <button class="btn btn-success" onclick="addClub()">
                <i class="fas fa-plus"></i> Add Club
            </button>
            <button class="btn btn-info" onclick="viewClubs()">
                <i class="fas fa-eye"></i> View Clubs
            </button>
        </div>
        <div id="clubContent"></div>
    `, 'large');
}

function addClub() {
    const clubContent = document.getElementById('clubContent');
    clubContent.innerHTML = `
        <h4>Add New Club</h4>
        <form onsubmit="saveClub(event)">
            <div class="form-group">
                <label>Club Name</label>
                <input type="text" class="form-control" id="clubName" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea class="form-control" id="clubDescription" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Teacher In Charge</label>
                <input type="text" class="form-control" id="clubTeacher" required>
            </div>
            <button type="submit" class="btn btn-success">Create Club</button>
        </form>
    `;
}

function saveClub(event) {
    event.preventDefault();
    
    const club = {
        id: Date.now(),
        name: document.getElementById('clubName').value,
        description: document.getElementById('clubDescription').value,
        teacher: document.getElementById('clubTeacher').value,
        members: [],
        createdDate: new Date().toISOString()
    };

    clubs.push(club);
    localStorage.setItem('clubs', JSON.stringify(clubs));
    
    showAlert('Club created successfully!', 'success');
    viewClubs();
}

function viewClubs() {
    const clubContent = document.getElementById('clubContent');
    clubContent.innerHTML = `
        <h4>All Clubs</h4>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Club Name</th>
                        <th>Teacher</th>
                        <th>Members</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${clubs.map(club => `
                        <tr>
                            <td>${club.name}</td>
                            <td>${club.teacher}</td>
                            <td>${club.members.length}</td>
                            <td>
                                <button class="btn btn-info" onclick="manageClubMembers('${club.id}')">
                                    <i class="fas fa-users"></i> Manage Members
                                </button>
                                ${hasPermission(['Admin']) ? `
                                    <button class="btn btn-danger" onclick="deleteClub('${club.id}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function manageClubMembers(clubId) {
    const club = clubs.find(c => c.id == clubId);
    if (!club) return;

    const modal = createModal(`Manage ${club.name} Members`, `
        <div class="form-group">
            <label>Add Students to Club</label>
            <select class="form-control" id="studentSelect" multiple size="10">
                ${students.map(student => `
                    <option value="${student.id}" ${club.members.includes(student.id) ? 'selected' : ''}>
                        ${student.name} (${student.admissionNumber}) - Grade ${student.grade}
                    </option>
                `).join('')}
            </select>
            <small class="text-muted">Hold Ctrl/Cmd to select multiple students</small>
        </div>
        <button class="btn btn-success" onclick="updateClubMembers('${clubId}')">
            <i class="fas fa-save"></i> Update Members
        </button>
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    `);
}

function updateClubMembers(clubId) {
    const select = document.getElementById('studentSelect');
    const selectedIds = Array.from(select.selectedOptions).map(option => option.value);
    
    const clubIndex = clubs.findIndex(c => c.id == clubId);
    if (clubIndex !== -1) {
        clubs[clubIndex].members = selectedIds;
        localStorage.setItem('clubs', JSON.stringify(clubs));
        showAlert('Club members updated successfully!', 'success');
        closeModal();
        viewClubs();
    }
}

function deleteClub(clubId) {
    if (confirm('Are you sure you want to delete this club?')) {
        clubs = clubs.filter(c => c.id != clubId);
        localStorage.setItem('clubs', JSON.stringify(clubs));
        showAlert('Club deleted successfully!', 'success');
        viewClubs();
    }
}

// Graduated students
function showGraduatedStudents() {
    const modal = createModal('Graduated Students', `
        <div class="form-group">
            <label>Filter by Graduation Year</label>
            <select class="form-control" id="yearFilter" onchange="filterGraduates()">
                <option value="all">All Years</option>
                ${[...new Set(graduatedStudents.map(s => s.graduationYear))].sort().map(year => 
                    `<option value="${year}">${year}</option>`
                ).join('')}
            </select>
        </div>
        <div class="table-container" id="graduatesTable">
            ${generateGraduatesTable()}
        </div>
    `, 'large');
}

function generateGraduatesTable() {
    return `
        <table>
            <thead>
                <tr>
                    <th>Adm</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Graduation Year</th>
                    <th>Graduation Date</th>
                </tr>
            </thead>
            <tbody>
                ${graduatedStudents.map(student => `
                    <tr data-year="${student.graduationYear}">
                        <td>${student.admissionNumber}</td>
                        <td>${student.name}</td>
                        <td>${student.gender}</td>
                        <td>${student.graduationYear}</td>
                        <td>${new Date(student.graduationDate).toLocaleDateString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function filterGraduates() {
    const year = document.getElementById('yearFilter').value;
    const rows = document.querySelectorAll('#graduatesTable tbody tr');

    rows.forEach(row => {
        if (year === 'all' || row.dataset.year === year) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Account settings
function showAccountSettings() {
    hideAllSections();
    document.getElementById('accountSettings').classList.remove('hidden');
    
    document.getElementById('settingsFullName').value = currentUser.fullName;
    document.getElementById('settingsEmail').value = currentUser.email;
}

function updateAccount(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('settingsFullName').value;
    const email = document.getElementById('settingsEmail').value;
    const password = document.getElementById('settingsPassword').value;
    const photoFile = document.getElementById('settingsPhoto').files[0];

    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].fullName = fullName;
        users[userIndex].email = email;
        
        if (password) {
            users[userIndex].password = password;
        }

        if (photoFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                users[userIndex].photo = e.target.result;
                saveUserUpdate(userIndex);
            };
            reader.readAsDataURL(photoFile);
        } else {
            saveUserUpdate(userIndex);
        }
    }
}

function saveUserUpdate(userIndex) {
    currentUser = users[userIndex];
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    updateUserInfo();
    showAlert('Account updated successfully!', 'success');
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        users = users.filter(u => u.id !== currentUser.id);
        localStorage.setItem('users', JSON.stringify(users));
        logout();
        showAlert('Account deleted successfully!', 'success');
    }
}

// Student details
function showStudentDetails(studentId) {
    const student = students.find(s => s.id == studentId);
    if (!student) return;

    const studentExams = exams.filter(e => e.grade === student.grade && e.marks[studentId]);
    const studentPayments = payments[studentId] || {};
    const studentClubs = clubs.filter(c => c.members.includes(studentId));

    const modal = createModal(`${student.name} Details`, `
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
            <div>
                ${student.photo ? `<img src="${student.photo}" alt="Student Photo" style="width: 100%; max-width: 200px; border-radius: 10px;">` : '<div style="width: 200px; height: 200px; background: #ddd; border-radius: 10px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-user fa-3x"></i></div>'}
                <h4>${student.name}</h4>
                <p><strong>Admission:</strong> ${student.admissionNumber}</p>
                <p><strong>Grade:</strong> ${student.grade}</p>
                <p><strong>Gender:</strong> ${student.gender}</p>
                <p><strong>Age:</strong> ${student.age}</p>
            </div>
            <div>
                <div style="margin-bottom: 20px;">
                    <h5>Exam Results</h5>
                    ${studentExams.length > 0 ? studentExams.map(exam => `
                        <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <strong>${exam.name} - Term ${exam.term} ${exam.year}</strong>
                            <div style="margin-top: 5px;">
                                ${exam.subjects.map(subject => 
                                    `${subject}: ${exam.marks[studentId][subject] || 0}`
                                ).join(' | ')}
                            </div>
                            <div><strong>Total: ${calculateTotal(exam.marks[studentId])}</strong></div>
                        </div>
                    `).join('') : '<p>No exam results available.</p>'}
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h5>Payment Status</h5>
                    ${Object.keys(studentPayments).length > 0 ? Object.entries(studentPayments).map(([key, fee]) => {
                        const percentage = fee.amount > 0 ? Math.round((fee.paid / fee.amount) * 100) : 0;
                        return `
                            <div style="margin-bottom: 10px;">
                                <div>${fee.name}: ${fee.paid}/${fee.amount}</div>
                                <div class="progress-bar" style="height: 15px;">
                                    <div class="progress-fill" style="width: ${percentage}%; height: 100%; font-size: 10px;">${percentage}%</div>
                                </div>
                            </div>
                        `;
                    }).join('') : '<p>No payment records available.</p>'}
                </div>
                
                <div>
                    <h5>Clubs</h5>
                    ${studentClubs.length > 0 ? studentClubs.map(club => `
                        <div style="margin-bottom: 5px; padding: 5px; background: #f8f9fa; border-radius: 3px;">
                            ${club.name} (${club.teacher})
                        </div>
                    `).join('') : '<p>Not a member of any clubs.</p>'}
                </div>
            </div>
        </div>
    `, 'large');
}

// Additional exam options function
function showExamOptions(studentId) {
    const student = students.find(s => s.id == studentId);
    if (!student) return;

    const modal = createModal(`Exam Options - ${student.name}`, `
        <div style="display: flex; gap: 15px; flex-wrap: wrap;">
            <button class="btn btn-success" onclick="closeModal(); showExamSection();">
                <i class="fas fa-plus"></i> Add New Exam
            </button>
            <button class="btn btn-info" onclick="viewStudentExams('${studentId}')">
                <i class="fas fa-eye"></i> View Exam Results
            </button>
        </div>
    `);
}

function viewStudentExams(studentId) {
    const student = students.find(s => s.id == studentId);
    const studentExams = exams.filter(e => e.grade === student.grade && e.marks[studentId]);
    
    closeModal();
    const modal = createModal(`${student.name} - Exam Results`, `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Exam Name</th>
                        <th>Term</th>
                        <th>Year</th>
                        <th>Total Marks</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentExams.map(exam => `
                        <tr>
                            <td>${exam.name}</td>
                            <td>Term ${exam.term}</td>
                            <td>${exam.year}</td>
                            <td>${calculateTotal(exam.marks[studentId])}</td>
                            <td>
                                <button class="btn btn-info" onclick="viewDetailedMarks('${exam.id}', '${studentId}')">
                                    <i class="fas fa-eye"></i> View Details
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ${studentExams.length === 0 ? '<p>No exam results found for this student.</p>' : ''}
    `, 'large');
}

function viewDetailedMarks(examId, studentId) {
    const exam = exams.find(e => e.id == examId);
    const student = students.find(s => s.id == studentId);
    
    if (!exam || !student) return;

    closeModal();
    const modal = createModal(`${student.name} - ${exam.name} Results`, `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Marks</th>
                    </tr>
                </thead>
                <tbody>
                    ${exam.subjects.map(subject => `
                        <tr>
                            <td>${subject}</td>
                            <td>${exam.marks[studentId][subject] || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top: 20px; padding: 15px; background: var(--light-color); border-radius: 8px;">
            <strong>Total: ${calculateTotal(exam.marks[studentId])} marks</strong>
        </div>
    `);
}

// Utility functions
function hasPermission(allowedRoles) {
    return currentUser && allowedRoles.includes(currentUser.category);
}

function createModal(title, content, size = 'medium') {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content ${size === 'large' ? 'large' : ''}">
            <span class="close" onclick="closeModal()">&times;</span>
            <h3>${title}</h3>
            ${content}
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    return modal;
}

function closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.innerHTML = '';
}

function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = field.nextElementSibling;
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        field.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function updateDashboardStats() {
    document.getElementById('totalStudents').textContent = students.length;
    document.getElementById('totalExams').textContent = exams.length;
    document.getElementById('totalClubs').textContent = clubs.length;
    document.getElementById('graduatedStudents').textContent = graduatedStudents.length;
}

// Export functions
function exportExamToExcel(examId) {
    const exam = exams.find(e => e.id == examId);
    if (!exam) return;

    const gradeStudents = students.filter(s => s.grade === exam.grade);
    
    let csvContent = `${exam.name}, Grade ${exam.grade}, Term ${exam.term}, ${exam.year}\n`;
    csvContent += `Admission Number,Name,${exam.subjects.join(',')},Total\n`;
    
    gradeStudents.forEach(student => {
        const marks = exam.subjects.map(subject => exam.marks[student.id][subject] || 0);
        const total = calculateTotal(exam.marks[student.id]);
        csvContent += `${student.admissionNumber},${student.name},${marks.join(',')},${total}\n`;
    });

    downloadCSV(csvContent, `${exam.name}_Grade${exam.grade}_Results.csv`);
}

function exportFeeReminders() {
    const filter = document.getElementById('paymentFilter').value;
    const visibleRows = document.querySelectorAll('#paymentTable tbody tr:not([style*="display: none"])');
    
    let csvContent = 'Fee Reminders Report\n';
    csvContent += 'Admission Number,Name,Grade,Outstanding Fees\n';
    
    visibleRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const adm = cells[0].textContent;
        const name = cells[1].textContent;
        const grade = cells[2].textContent;
        const studentId = students.find(s => s.admissionNumber === adm)?.id;
        
        if (studentId && payments[studentId]) {
            const outstandingFees = Object.entries(payments[studentId])
                .filter(([key, fee]) => fee.paid < fee.amount)
                .map(([key, fee]) => `${fee.name}: ${fee.amount - fee.paid}`)
                .join('; ');
            
            csvContent += `${adm},${name},${grade},"${outstandingFees}"\n`;
        }
    });

    downloadCSV(csvContent, 'Fee_Reminders.csv');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Sample data for testing
function loadSampleData() {
    if (users.length === 0) {
        users.push({
            id: 1,
            fullName: 'System Administrator',
            username: 'admin',
            phone: '1234567890',
            email: 'admin@school.com',
            category: 'Admin',
            password: 'admin123',
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('users', JSON.stringify(users));
    }

    if (students.length === 0 && admissionCounter === 0) {
        const sampleStudents = [
            { name: 'John Doe', gender: 'M', age: 13, grade: 7 },
            { name: 'Jane Smith', gender: 'F', age: 14, grade: 8 },
            { name: 'Mike Johnson', gender: 'M', age: 15, grade: 9 }
        ];

        sampleStudents.forEach(studentData => {
            admissionCounter++;
            students.push({
                id: Date.now() + Math.random(),
                admissionNumber: admissionCounter.toString().padStart(3, '0'),
                name: studentData.name,
                gender: studentData.gender,
                age: studentData.age,
                grade: studentData.grade,
                photo: null,
                addedDate: new Date().toISOString(),
                exams: {},
                payments: {},
                clubs: []
            });
        });

        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('admissionCounter', admissionCounter.toString());
    }
}

// Auto-save data periodically
setInterval(() => {
    if (currentUser) {
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('exams', JSON.stringify(exams));
        localStorage.setItem('payments', JSON.stringify(payments));
        localStorage.setItem('clubs', JSON.stringify(clubs));
        localStorage.setItem('graduatedStudents', JSON.stringify(graduatedStudents));
    }
}, 30000);

// Handle browser tab close/refresh
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('exams', JSON.stringify(exams));
        localStorage.setItem('payments', JSON.stringify(payments));
        localStorage.setItem('clubs', JSON.stringify(clubs));
        localStorage.setItem('graduatedStudents', JSON.stringify(graduatedStudents));
    }
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
    