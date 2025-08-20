import Layout from "@/components/layouts/internal";
import Breadcrumb from "@/components/breadcrumb";
import withSession from "@/lib/session";
import auth from "@/lib/middleware";
import {AppContext} from "@/components/context";
import Form from "@/components/users/form";
import { useRouter } from "next/router";

export const getServerSideProps = withSession(auth);

export default function CreateUser(props) {
    const router = useRouter();

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

    const handleUserCreate = (createdData) => {
        // Redirect to users list or edit page after successful creation
        router.push('/users');
        // Alternatively, you could redirect to the edit page of the newly created user:
        // if (createdData.id) {
        //     router.push(`/users/edit/${createdData.id}`);
        // }
    };

    return (
        <AppContext.Provider value={enhancedConfig}>
            <Layout location="users">
                <Breadcrumb links={[
                    {label: 'Users', url: '/users'},
                    {label: 'Create', url: '#create'},
                ]}/>
                <div className="my-4">
                    <header className="text-4xl text-gray-600">Register User</header>
                    <p>
                        <small>Create a new user account</small>
                    </p>
                </div>
                <div className="my-10">
                    <Form onUpdate={handleUserCreate} />
                </div>
            </Layout>
        </AppContext.Provider>
    )
}