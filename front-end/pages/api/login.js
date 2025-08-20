import withSession from '@/lib/session'
import axios from 'axios';


export default withSession(async (req, res) => {
    const {username, password} = await req.body
    // Use Docker service name for server-side API calls
    const backendHost = process.env.NEXT_PRIVATE_BACKEND_HOST || process.env.BACKEND_API_HOST;
    const loginUrl = backendHost + '/api/login';


    try {
        const response = await axios.post(loginUrl, {username: username, password: password});

        if (response.status === 200) {
            const {user, api_token} = response.data;

            req.session.set('user', user)
            req.session.set('api_token', api_token)
            await req.session.save()
            return res.json({logged_in: true});
        }

        const status = response.data.message;
        const errors = response.data.errors;
        return res.json({status, logged_in: false, errors});

    } catch (err) {
        let status = 'Something went wrong';
        let errors = null;

        console.log(err);
        if (err.response) {
            status = err.response.data.message;
            errors = err.response.data.errors;
        }
        return res.json({logged_in: false, status, errors: errors});
    }


})
