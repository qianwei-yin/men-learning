/* eslint-disable */

const axios = require('axios');

const login = async (email, password) => {
    try {
        const res = await axios.post('http://localhost/api/v1/users/login', { email, password });
        console.log(res);
    } catch (error) {
        console.log(error.message);
    }
};

document.querySelector('.form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
});
