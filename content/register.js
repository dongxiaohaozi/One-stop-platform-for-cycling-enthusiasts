//handler to capture user credentials for registering purpose
document.getElementById('register_button').onclick = function (e) {
    let name = document.getElementById('name').value;
    let gender = document.getElementById('gender').value;
    let birthDate = document.getElementById('DOB').value;
    let city = document.getElementById('location').value;
    let pass = document.getElementById('pass').value;
    let conPass = document.getElementById('con-pass').value;
    e.preventDefault();
    let personalInfo = { name: name, gender: gender, birthDate: birthDate, city: city, pass: pass }
    console.log(personalInfo);
    if (!name) {
        alert('Username cannot be empty');
    } else if (!pass) {
        alert('Password cannot be empty');
    } else if (conPass != pass) {
        alert('Inconsistent confirm password, please try again');
    } else {
        fetch('/register', { //post the credentials to server
            method: 'POST',
            body: JSON.stringify(personalInfo),
            headers: {
                'content-type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(res => {
                alert(res.msg);
                if (!res.rescode) {
                    location.href = './index.html';
                }
            }).catch(error => {
                console.log(error);
            });
    }
}