import Layout from "@/components/layouts/internal";
import Breadcrumb from "@/components/breadcrumb";
import withSession from "@/lib/session";
import auth from "@/lib/middleware";
import {AppContext} from "@/components/context";
import Form from "@/components/users/form";
import {useEffect, useState} from "react";
import Loader from "@/components/loader";
import {useRouter} from "next/router";
import axios from "axios";
import PasswordForm from "@/components/users/password-form";

export const getServerSideProps = withSession(auth);

export default function EditUser(props) {
    const router = useRouter();
    const {id} = router.query;
    const [data, setData] = useState(null);
    const [isFetching, setIsFetching] = useState(false);

    // Enhanced config with CSRF support
    const enhancedConfig = {
        ...props.configBundle,
        getCsrfToken: () => {
            if (typeof document !== 'undefined') {
                return document.querySelector('meta[name="csrf-token"]')?.content;
            }
            return null;
        }
    };

    useEffect(() => {
        if (id) {
            fetchData(id);
        }
    }, [id]);

    const fetchData = async (userId) => {
        setIsFetching(true);
        try {
            const response = await axios.get(
                `${props.configBundle.backendUrl}/admin/users/${userId}`,
                {
                    headers: {
                        ...props.configBundle.authHeader,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    withCredentials: true
                }
            );

            if (response.status === 200) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            // Handle error appropriately
        }
        setIsFetching(false);
    };

    const handleUserUpdate = (updatedData) => {
        // Update local state with new data
        setData(prev => ({...prev, ...updatedData}));
        // You could also show a success message here
    };

    return (
        <AppContext.Provider value={enhancedConfig}>
            <Layout location="users">
                <Breadcrumb links={[
                    {label: 'Users', url: '/users'},
                    {label: 'Edit', url: '#edit'},
                ]}/>
                <div className="my-4">
                    <header className="text-4xl text-gray-600">Edit User</header>
                    <p>
                        <small>Edit user details</small>
                    </p>
                </div>
                <div className="my-10">
                    {isFetching && <Loader/>}
                    {!isFetching && data ? (
                        <>
                            <Form 
                                initData={data} 
                                onUpdate={handleUserUpdate}
                            />
                            <PasswordForm 
                                user={data} 
                                onPasswordUpdate={() => {
                                    // Handle password update success if needed
                                }}
                            />
                        </>
                    ) : !isFetching ? (
                        <div className="text-center text-gray-500">
                            User not found or error loading data
                        </div>
                    ) : null}
                </div>
            </Layout>
        </AppContext.Provider>
    )
}