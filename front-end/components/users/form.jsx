import {useContext, useEffect, useState} from "react";
import FormError from "@/components/form-error";
import Link from "next/link";
import api from "@/lib/axios";
import {AppContext} from "@/components/context";
import {errorAlert, successAlert} from "@/lib/alerts";

export default function Form(props) {
    const config = useContext(AppContext);
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [errors, setErrors] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);

    // CSRF token handling is now done by our axios interceptor

    const resetData = () => {
        setUsername("");
        setFirstname("");
        setLastname("");
        setEmail("");
        setPhone("");
    }

    const initData = (data) => {
        setUsername(data.username || "");
        setFirstname(data.first_name || "");
        setLastname(data.last_name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
    }

    const handleError = (err) => {
        let message = "Oops! Something went wrong";
        if (err.response && err.response.status === 422) {
            setErrors(err.response.data.errors);
            message = err.response.data.message;
        }

        if (err.response) {
            message = err.response.data.message ?? "Oops! Something went wrong";
        }

        console.error(err);
        errorAlert("Oops! ", message);
    }

    const processData = async () => {
        setIsProcessing(true);
        setErrors({});

        try {
            let data = {
                username,
                first_name: firstname,
                last_name: lastname,
                email,
                phone,
            };

            props.initData ? await processUpdate(data) : await processStore(data);
        } catch (err) {
            handleError(err);
        }

        setIsProcessing(false);
    }

    const processStore = async (formData) => {
        const response = await api.post('/api/admin/users', formData, {
            headers: {
                ...config.authHeader,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 201) {
            successAlert("Success!", "User created successfully!");
            resetData();
        }
    }

    const processUpdate = async (formData) => {
        const response = await api.patch(
            `/api/users/${props.initData.id}`,
            formData,
            {
                headers: {
                    ...config.authHeader,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status === 200) {
            successAlert("Success!", "User updated successfully!");
            if (props.onUpdate) {
                props.onUpdate(response.data.data);
            }
        }
    }

    useEffect(() => {
        if (props.initData) {
            initData(props.initData);
        }
    }, [props.initData]);

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 my-4">
                <div>
                    <form>
                        <label className="form-control">
                            <div className="label">
                                <span className="label-text">Username</span>
                            </div>
                            <input 
                                type="text"
                                className={`input input-bordered flex items-center gap-2 ${errors.username && 'input-error'}`}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Type username" 
                                required
                            />
                            <FormError error={errors.username}/>
                        </label>
                        
                        <div className="my-2">
                            <hr/>
                        </div>
                        
                        <label className="form-control">
                            <div className="label">
                                <span className="label-text">First Name</span>
                            </div>
                            <input 
                                type="text"
                                className={`input input-bordered flex items-center gap-2 ${errors.first_name && 'input-error'}`}
                                value={firstname}
                                onChange={(e) => setFirstname(e.target.value)}
                                placeholder="Type first name" 
                                required
                            />
                            <FormError error={errors.first_name}/>
                        </label>
                        
                        <label className="form-control">
                            <div className="label">
                                <span className="label-text">Last Name</span>
                            </div>
                            <input 
                                type="text"
                                className={`input input-bordered flex items-center gap-2 ${errors.last_name && 'input-error'}`}
                                value={lastname}
                                onChange={(e) => setLastname(e.target.value)}
                                placeholder="Type last name" 
                                required
                            />
                            <FormError error={errors.last_name}/>
                        </label>
                        
                        <label className="form-control">
                            <div className="label">
                                <span className="label-text">Email</span>
                            </div>
                            <input 
                                type="email"
                                className={`input input-bordered flex items-center gap-2 ${errors.email && 'input-error'}`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Type email address" 
                                required
                            />
                            <FormError error={errors.email}/>
                        </label>
                        
                        <label className="form-control">
                            <div className="label">
                                <span className="label-text">Phone</span>
                            </div>
                            <input 
                                type="text"
                                className={`input input-bordered flex items-center gap-2 ${errors.phone && 'input-error'}`}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Type phone number" 
                                required
                            />
                            <FormError error={errors.phone}/>
                        </label>
                    </form>
                </div>
            </div>
            
            <div className="my-4 gap-2 flex">
                <button 
                    className="btn btn-primary" 
                    onClick={processData}
                    disabled={isProcessing}
                >
                    {isProcessing && <span className="loading loading-spinner loading-md"></span>}
                    {isProcessing ? 'Processing...' : 'Save'}
                </button>
                
                <Link href={"/users"} className="btn btn-neutral border-0 hover:text-white">
                    Cancel
                </Link>
            </div>
        </>
    )
}