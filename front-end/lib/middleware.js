import {useRouter} from 'next/router'

export default async function auth({req, res}) {
    const user = req.session.get('user')

    if (!user) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }


    // Use client-accessible URL for frontend API calls (browser requests)
    const clientBackendUrl = process.env.BACKEND_API_HOST;
    
    let configBundle = {
        user: req.session.get('user'),
        apiToken: req.session.get('api_token'),
        backendUrl: clientBackendUrl + "/api",
        hostUrl: clientBackendUrl,
        authHeader: req.session.get('api_token') ? {"Authorization": "Bearer " + req.session.get('api_token')} : {}
    }

    return {
        props: {
            user: req.session.get('user'),
            api_token: req.session.get('api_token'),
            configBundle: configBundle,
        },
    }
}


export async function unSecureAuth({req, res}) {
    const user = req.session.get('user')

    if (!user) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    let configBundle = {
        user: req.session.get('user'),
        apiToken: req.session.get('api_token'),
        backendUrl: process.env.BACKEND_API_HOST + "/api",
        authHeader: {"Authorization": "Bearer " + req.session.get('api_token')}
    }
    return {
        props: {
            user: req.session.get('user'),
            apiToken: req.session.get('api_token'),
            backendUrl: process.env.BACKEND_API_HOST + "/api",
            configBundle: configBundle
        },
    }
}


export async function authGuard({req, res}) {
    const user = req.session.get('user')

    // redirect to dashboard if user is already logged in.
    if (user) {
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false,
            },
        }
    }

    return {
        props: {
            url: process.env.BACKEND_API_HOST
        },
    }

}
