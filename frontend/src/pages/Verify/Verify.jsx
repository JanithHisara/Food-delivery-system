import React, { useContext, useEffect, useState } from 'react';
import './Verify.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';

const Verify = () => {
    const [searchParams] = useSearchParams();
    const success = searchParams.get("success");
    const orderId = searchParams.get("orderId");
    const { url } = useContext(StoreContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(""); // "success", "fail", or ""

    const verifyPayment = async () => {
        try {
            const response = await axios.post(`${url}/api/order/verify`, {
                success,
                orderId
            });

            if (response.data.success) {
                setStatus("success");
                setTimeout(() => navigate("/myorders"), 2000);
            } else {
                setStatus("fail");
                setTimeout(() => navigate("/"), 2000);
            }
        } catch (error) {
            console.error("Error verifying payment:", error);
            setStatus("fail");
            setTimeout(() => navigate("/"), 2000);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        verifyPayment();
    }, []);

    return (
        <div className='verify'>
            {loading ? (
                <div className="spinner"></div>
            ) : status === "success" ? (
                <div className="status-message success">Payment Successful!</div>
            ) : (
                <div className="status-message fail">Payment Failed. Redirecting...</div>
            )}
        </div>
    );
};

export default Verify;
