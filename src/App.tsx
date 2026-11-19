import { AdminView } from './admin/AdminView';
import { Layout } from './components/Layout';
import { ManagerView } from './manager/ManagerView';
import { StoreProvider, useStore } from './store/AppStore';

function Routes() {
  const { login } = useStore();
  return login.role === 'admin' ? <AdminView /> : <ManagerView />;
}

export default function App() {
  return (
    <StoreProvider>
      <Layout>
        <Routes />
      </Layout>
    </StoreProvider>
  );
}
