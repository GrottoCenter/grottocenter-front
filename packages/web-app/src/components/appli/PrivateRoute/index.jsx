import { Outlet } from 'react-router-dom';
import AuthChecker from '../AuthChecker';

const PrivateRoute = () => <AuthChecker componentToDisplay={<Outlet />} />;

export default PrivateRoute;
