import React, { useState, useEffect, useMemo } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation, 
  Navigate 
} from 'react-router-dom';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  handleFirestoreError,
  OperationType,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from './firebase';
import { Product, Entry, Exit, ExitItem, Maintenance, MaintenancePartRequested } from './types';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ErrorBoundary } from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';

// --- Components ---

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-surface">
    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-on-surface-variant font-medium animate-pulse">Sincronizando ecossistema...</p>
  </div>
);

const LoginScreen = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('O login por e-mail/senha não está habilitado no console do Firebase.');
      } else {
        setError('Ocorreu um erro ao tentar entrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="max-w-md w-full bg-surface-container-lowest p-10 rounded-[2.5rem] shadow-2xl text-center border border-outline-variant/10">
        <div className="w-20 h-20 bg-primary text-on-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-4xl">inventory_2</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-on-surface mb-4">Inventory Pro</h1>
        <p className="text-on-surface-variant mb-8 leading-relaxed">
          {isSignUp ? 'Crie sua conta para começar.' : 'Entre para gerenciar seu ecossistema.'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4 mb-6">
          <input 
            type="email" 
            placeholder="E-mail" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-on-surface font-bold focus:ring-2 focus:ring-primary/10"
            required
          />
          <input 
            type="password" 
            placeholder="Senha" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 text-on-surface font-bold focus:ring-2 focus:ring-primary/10"
            required
          />
          
          {error && <p className="text-error text-xs font-bold">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-black py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-[1px] flex-grow bg-outline-variant opacity-20"></div>
          <span className="text-[10px] font-bold text-outline uppercase">ou</span>
          <div className="h-[1px] flex-grow bg-outline-variant opacity-20"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-4 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold py-4 px-6 rounded-2xl transition-all active:scale-95 border border-outline-variant/20 mb-6"
        >
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuwCQuCreNSesFolGQsGKkWdKBAAwwUZz6NzL9yJ6tYCNNGM4otKWjlnqy-MMtaksgZtvE6fTbXLr3VH6Go_8y_Wf19QSVxdwwOIFp5s_zjhoFTW6h5YDnucseBD91cf5v2BtT1GoZX4VpolDhky4DeoV4n-LtKLVpRPzcDgadl0b1AOUK3_wI5iPbW4ZC2XN5DTA83eLRK5IGrJbt1ivTqqmjUrpNWjfr_OcIfQ77eVtY2bzTyLA5nU7v4gFgiB0H_KKz41H8E6g" alt="Google" className="w-6 h-6" />
          Google
        </button>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-primary font-bold text-sm hover:underline"
        >
          {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Registre-se'}
        </button>
      </div>
    </div>
  );
};

const Navbar = ({ user, userRole }: { user: User, userRole: string }) => {
  const location = useLocation();
  
  const navItems = userRole === 'monitor' 
    ? [
        { path: '/maintenances', label: 'Revisões', icon: 'handyman' },
      ]
    : [
        { path: '/', label: 'Início', icon: 'dashboard' },
        { path: '/entries', label: 'Entradas', icon: 'add_box' },
        { path: '/exits', label: 'Saídas', icon: 'local_shipping' },
        { path: '/inventory', label: 'Estoque', icon: 'category' },
        { path: '/maintenances', label: 'Revisões', icon: 'handyman' },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full flex justify-between items-center px-1 sm:px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 bg-[#edf4ff]/95 backdrop-blur-2xl border-t border-[#091d2e]/10 shadow-[0_-8px_30px_rgba(9,29,46,0.12)] z-[9999] rounded-t-3xl md:max-w-md md:left-1/2 md:-translate-x-1/2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 min-w-0 py-2 mx-0.5 rounded-2xl transition-all duration-200 active:scale-95 touch-manipulation ${
              isActive 
                ? 'bg-[#d9eaff] text-[#004B87]' 
                : 'text-[#424750] hover:text-[#004B87]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}>
              {item.icon}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight uppercase mt-1 w-full text-center truncate px-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const Header = ({ user }: { user: User }) => (
  <header className="w-full top-0 sticky z-40 bg-surface/80 backdrop-blur-md flex items-center justify-between px-6 h-16">
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-primary text-2xl">inventory_2</span>
      <h1 className="font-bold tracking-tight text-xl text-primary">Inventory Pro</h1>
    </div>
    <div className="flex items-center gap-4">
      <button 
        onClick={() => signOut(auth)}
        className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20"
      >
        <img src={user.photoURL || ''} alt="User" referrerPolicy="no-referrer" />
      </button>
    </div>
  </header>
);

// --- Pages ---

const Dashboard = ({ products, entries, exits }: { products: Product[], entries: Entry[], exits: Exit[] }) => {
  const monthlyTotal = useMemo(() => {
    return entries.reduce((acc, curr) => acc + (curr.totalValue || 0), 0);
  }, [entries]);

  const monthlyExits = useMemo(() => {
    return exits.reduce((acc, curr) => {
      const itemsTotal = curr.items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (item.quantity * (product?.unitValue || 0));
      }, 0);
      return acc + itemsTotal;
    }, 0);
  }, [exits, products]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, 'dd/MM'),
        fullDate: date,
        entries: 0,
        exits: 0
      };
    }).reverse();

    last7Days.forEach(day => {
      entries.forEach(entry => {
        if (isSameDay(parseISO(entry.date), day.fullDate)) {
          day.entries += entry.quantity;
        }
      });
      exits.forEach(exit => {
        if (isSameDay(parseISO(exit.date), day.fullDate)) {
          exit.items.forEach(item => {
            day.exits += item.quantity;
          });
        }
      });
    });

    return last7Days;
  }, [entries, exits]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      <section className="space-y-2">
        <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Resumo Mensal</p>
        <h2 className="text-4xl font-black tracking-tighter text-on-surface">Painel de Controle</h2>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-3xl flex flex-col justify-between h-44 shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-start">
            <div className="bg-secondary-container p-2 rounded-xl">
              <span className="material-symbols-outlined text-on-secondary-container">trending_up</span>
            </div>
          </div>
          <div>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-1">Entradas</p>
            <p className="text-secondary text-2xl font-black tracking-tight">R$ {monthlyTotal.toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-3xl flex flex-col justify-between h-44 shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-start">
            <div className="bg-tertiary-fixed p-2 rounded-xl">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant">trending_down</span>
            </div>
          </div>
          <div>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-1">Saídas</p>
            <p className="text-tertiary-fixed-dim text-2xl font-black tracking-tight">R$ {monthlyExits.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low p-6 rounded-3xl space-y-6">
        <div>
          <h3 className="font-bold text-lg">Tendência de Estoque</h3>
          <p className="text-on-surface-variant text-sm">Volume de movimentações (7 dias)</p>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="entries" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#006d43" />
                ))}
              </Bar>
              <Bar dataKey="exits" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-exit-${index}`} fill="#ffb783" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Atividade Recente</h3>
          <Link to="/inventory" className="text-primary font-bold text-sm">Ver Tudo</Link>
        </div>
        <div className="space-y-3">
          {entries.slice(0, 3).map(entry => (
            <div key={entry.id} className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-outline-variant/10">
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">add_circle</span>
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-bold text-sm truncate">{entry.productName}</h4>
                <p className="text-on-surface-variant text-xs truncate">+ {entry.quantity} unidades</p>
              </div>
              <div className="text-right">
                <p className="text-secondary font-bold text-sm">Entrada</p>
                <p className="text-on-surface-variant text-[10px]">{format(parseISO(entry.date), 'HH:mm')}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

const EntriesPage = ({ products, user, entries }: { products: Product[], user: User, entries: Entry[] }) => {
  const [view, setView] = useState<'create' | 'list'>('create');
  const [mode, setMode] = useState<'invoice' | 'unit'>('invoice');

  // Invoice Data
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceValue, setInvoiceValue] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [storeName, setStoreName] = useState('');

  // Current Item Data
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductVehicle, setNewProductVehicle] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitValue, setUnitValue] = useState('');
  
  const calculatedTotal = quantity * (Number(unitValue) || 0);
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const resetCurrentItem = () => {
    setIsNewProduct(false);
    setSelectedProduct('');
    setNewProductName('');
    setNewProductVehicle('');
    setQuantity(1);
    setUnitValue('');
  };

  const handleAddItemToInvoice = () => {
    if (!isNewProduct && !selectedProduct) return;
    if (quantity <= 0) return;

    let displayName = '';
    if (isNewProduct) {
      if (!newProductName) return;
      displayName = `NOVO: ${newProductName} (${newProductVehicle})`;
    } else {
      const p = products.find(prod => prod.id === selectedProduct);
      displayName = p ? `${p.name} - ${p.vehicleModel}` : 'Produto';
    }

    setItems([...items, {
      id: Date.now().toString(),
      isNewProduct,
      selectedProduct,
      newProductName,
      newProductVehicle,
      quantity: Number(quantity),
      unitValue: Number(unitValue) || 0,
      totalValue: calculatedTotal,
      displayName
    }]);

    resetCurrentItem();
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleEditItem = (id: string) => {
    const itemToEdit = items.find(i => i.id === id);
    if (itemToEdit) {
      setIsNewProduct(itemToEdit.isNewProduct);
      setSelectedProduct(itemToEdit.selectedProduct);
      setNewProductName(itemToEdit.newProductName);
      setNewProductVehicle(itemToEdit.newProductVehicle);
      setQuantity(itemToEdit.quantity);
      setUnitValue(String(itemToEdit.unitValue));
      removeItem(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let itemsToProcess = [];

    if (mode === 'unit') {
      if (!isNewProduct && !selectedProduct) { setLoading(false); return; }
      if (quantity <= 0) { setLoading(false); return; }
      itemsToProcess = [{
        isNewProduct,
        selectedProduct,
        newProductName,
        newProductVehicle,
        quantity: Number(quantity),
        unitValue: Number(unitValue) || 0,
        totalValue: calculatedTotal
      }];
    } else {
      if (items.length === 0) { setLoading(false); return; }
      itemsToProcess = items;
    }

    try {
      for (const item of itemsToProcess) {
        let finalProductId = item.selectedProduct;
        let finalProductName = '';
        let finalVehicleModel = '';
        let finalCategory = 'Peças';

        if (item.isNewProduct) {
          const newProductData = {
            name: item.newProductName,
            vehicleModel: item.newProductVehicle,
            category: finalCategory,
            stock: item.quantity,
            unitValue: item.unitValue !== undefined ? item.unitValue : ((item.totalValue / item.quantity) || 0),
            lastUpdated: new Date().toISOString()
          };
          const productRef = await addDoc(collection(db, 'products'), newProductData);
          finalProductId = productRef.id;
          finalProductName = item.newProductName;
          finalVehicleModel = item.newProductVehicle;
        } else {
          const product = products.find(p => p.id === item.selectedProduct);
          if (product) {
            finalProductName = product.name;
            finalVehicleModel = product.vehicleModel || '';
            finalCategory = product.category;

            const productRef = doc(db, 'products', item.selectedProduct);
            await updateDoc(productRef, {
              stock: product.stock + item.quantity,
              lastUpdated: new Date().toISOString()
            });
          }
        }

        const entryData = {
          productId: finalProductId,
          productName: finalProductName,
          vehicleModel: finalVehicleModel,
          category: finalCategory,
          quantity: item.quantity,
          totalValue: item.totalValue,
          invoiceValue: mode === 'invoice' ? (Number(invoiceValue) || 0) : 0,
          invoiceNumber: mode === 'invoice' ? invoiceNumber : '',
          buyerName,
          storeName,
          date: new Date().toISOString(),
          authorUid: user.uid
        };

        await addDoc(collection(db, 'entries'), entryData);
      }

      // Reset everything on success
      setItems([]);
      setInvoiceNumber('');
      setInvoiceValue('');
      setBuyerName('');
      setStoreName('');
      resetCurrentItem();
      alert(mode === 'invoice' ? 'Nota e produtos registrados com sucesso!' : 'Entrada registrada com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'entries');
    } finally {
      setLoading(false);
    }
  };

  const invoiceItemsTotal = items.reduce((acc, curr) => acc + curr.totalValue, 0);

  const groupedInvoices = useMemo(() => {
    const grouped = new Map<string, { date: string, buyerName: string, storeName: string, total: number, items: Entry[], invoiceValue: number }>();
    const singles: Entry[] = [];

    entries.forEach(entry => {
      if (entry.invoiceNumber && entry.invoiceNumber.trim() !== '') {
        if (!grouped.has(entry.invoiceNumber)) {
          grouped.set(entry.invoiceNumber, {
            date: entry.date,
            buyerName: entry.buyerName,
            storeName: entry.storeName,
            total: 0,
            invoiceValue: entry.invoiceValue || 0,
            items: []
          });
        }
        const g = grouped.get(entry.invoiceNumber)!;
        g.items.push(entry);
        g.total += entry.totalValue;
      } else {
        singles.push(entry);
      }
    });

    return {
      withInvoice: Array.from(grouped.entries()).map(([num, data]) => ({ num, ...data })),
      singles
    };
  }, [entries]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8 pb-12"
    >
      <section className="space-y-2 flex justify-between items-center">
        <div>
          <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Operação de Fluxo</p>
          <h2 className="text-4xl font-black tracking-tighter text-on-surface">Entrada de Loja</h2>
        </div>
        <div>
          {view === 'list' ? (
            <button onClick={() => setView('create')} className="bg-primary text-on-primary font-bold py-2 px-4 rounded-xl shadow-sm text-sm">
              + Nova Entrada
            </button>
          ) : (
            <button onClick={() => setView('list')} className="bg-surface-container-high text-on-surface font-bold py-2 px-4 rounded-xl shadow-sm text-sm">
              Ver Histórico
            </button>
          )}
        </div>
      </section>

      {view === 'create' && (
        <div className="space-y-6">
          <div className="flex bg-surface-container-low rounded-2xl p-1 shadow-sm">
        <button
          onClick={() => setMode('invoice')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'invoice' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant'}`}
        >
          Com Nota Fiscal
        </button>
        <button
          onClick={() => setMode('unit')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'unit' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant'}`}
        >
          Unidade sem Nota
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm border border-outline-variant/10">
        <div className="space-y-6">
          
          {mode === 'invoice' && (
            <div className="space-y-4 pb-6 border-b border-outline-variant/10">
              <h3 className="font-bold text-primary">Dados da Nota Fiscal</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Nº Nota Fiscal</label>
                  <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Ex: 123456" className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-4 text-on-surface font-bold focus:ring-2 focus:ring-primary/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Valor Nota (R$)</label>
                  <input type="number" step="0.01" value={invoiceValue} onChange={(e) => setInvoiceValue(e.target.value)} placeholder="0,00" className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-4 text-on-surface font-bold focus:ring-2 focus:ring-primary/10" />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pb-6 border-b border-outline-variant/10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Quem Comprou</label>
              <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Nome" className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-4 text-on-surface font-bold focus:ring-2 focus:ring-primary/10" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Loja</label>
              <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Loja" className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-4 text-on-surface font-bold focus:ring-2 focus:ring-primary/10" required />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-on-surface">{mode === 'invoice' ? 'Adicionar Produto à Nota' : 'Dados do Produto'}</h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Produto / Peça</label>
              <select 
                value={isNewProduct ? 'NEW' : selectedProduct}
                onChange={(e) => {
                  if (e.target.value === 'NEW') setIsNewProduct(true);
                  else { setIsNewProduct(false); setSelectedProduct(e.target.value); }
                }}
                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-4 text-on-surface font-bold focus:ring-2 focus:ring-primary/10"
              >
                <option value="">Selecionar Peça/Produto do Inventário</option>
                <option value="NEW" className="font-black text-primary">+ CADASTRAR NOVA PEÇA</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {p.vehicleModel}</option>
                ))}
              </select>
            </div>

            {isNewProduct && (
              <div className="grid grid-cols-2 gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary px-1">Nome</label>
                  <input type="text" value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="Ex: Amortecedor" className="w-full bg-surface-container-lowest border-none rounded-2xl py-4 px-4 text-on-surface font-bold focus:ring-2 focus:ring-primary/10" />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary px-1">Modelo Moto</label>
                  <input type="text" value={newProductVehicle} onChange={e => setNewProductVehicle(e.target.value)} placeholder="Ex: Titan 150" className="w-full bg-surface-container-lowest border-none rounded-2xl py-4 px-4 text-on-surface font-bold focus:ring-2 focus:ring-primary/10" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Quantidade</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-4 text-on-surface font-bold focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Valor de Unid. (R$)</label>
                <input type="number" step="0.01" value={unitValue} onChange={(e) => setUnitValue(e.target.value)} placeholder="0,00" className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-4 text-on-surface font-bold focus:ring-2 focus:ring-primary/10" />
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10 flex justify-between items-center">
              <span className="font-bold text-sm text-on-surface-variant">Valor Total do Produto:</span>
              <span className="font-black text-lg text-primary">R$ {calculatedTotal.toFixed(2)}</span>
            </div>

            {mode === 'invoice' && (
              <button 
                type="button"
                onClick={handleAddItemToInvoice}
                disabled={(!isNewProduct && !selectedProduct) || quantity <= 0}
                className="w-full bg-secondary-container text-on-secondary-container font-black py-4 rounded-2xl active:scale-95 transition-all disabled:opacity-50 mt-2"
              >
                + Adicionar à Nota
              </button>
            )}
          </div>

          {mode === 'invoice' && (
            <div className="space-y-3 pt-6 border-t border-outline-variant/10">
              <h3 className="font-bold text-sm uppercase tracking-widest">Itens nesta Nota</h3>
              {items.map(item => (
                <div key={item.id} className="bg-surface-container-low p-4 rounded-2xl flex items-center justify-between border border-outline-variant/5">
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="font-bold text-sm truncate">{item.displayName}</h4>
                    <p className="text-xs text-on-surface-variant truncate">{item.quantity} un x R$ {(item.unitValue || 0).toFixed(2)} | Total: R$ {item.totalValue.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleEditItem(item.id)} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors">
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button type="button" onClick={() => removeItem(item.id)} className="p-2 text-error hover:bg-error/10 rounded-xl transition-colors">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-on-surface-variant text-center my-4">Nenhum produto adicionado à nota ainda.</p>}
              
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10 flex justify-between items-center">
                <span className="font-bold text-sm text-on-surface-variant">Soma dos Itens:</span>
                <span className={`font-black text-lg ${invoiceItemsTotal > (Number(invoiceValue)||0) ? 'text-error' : 'text-primary'}`}>
                  R$ {invoiceItemsTotal.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <button 
            type="button"
            onClick={handleSubmit}
            disabled={loading || (mode === 'invoice' && items.length === 0) || (mode === 'unit' && (!selectedProduct && !isNewProduct))}
            className="w-full bg-primary text-on-primary font-black py-5 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Sincronizando...' : (mode === 'invoice' ? 'Finalizar Nota Fiscal' : 'Salvar Entrada')}
          </button>

        </div>
      </div>
      </div>
      )}

      {view === 'list' && (
        <div className="space-y-6">
          <h3 className="font-bold text-lg text-primary uppercase tracking-widest mb-4 border-b border-outline-variant/10 pb-2">Notas Fiscais Cadastradas</h3>
          <div className="space-y-4">
            {groupedInvoices.withInvoice.map((inv, idx) => (
              <div key={idx} className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/10 shadow-sm space-y-3">
                <div className="flex justify-between items-start border-b border-outline-variant/10 pb-3">
                  <div>
                    <h3 className="font-black text-lg text-primary uppercase tracking-tight">NF: {inv.num}</h3>
                    <p className="text-xs font-bold text-on-surface-variant">Comprador: {inv.buyerName} • Loja: {inv.storeName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{format(parseISO(inv.date), 'dd/MM/yyyy')}</span>
                    <p className="text-xs font-bold text-secondary mt-1">Total NF: R$ {inv.invoiceValue.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                
                <div className="text-xs pt-1">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Itens da Nota ({inv.items.reduce((a,b)=>a+b.quantity,0)} UND.)</p>
                  <ul className="space-y-1">
                    {inv.items.map((item, i) => (
                      <li key={i} className="flex justify-between text-on-surface font-medium bg-surface-container-low px-3 py-1.5 rounded-lg">
                        <span>{item.quantity}x {item.productName} <span className="text-outline uppercase text-[9px] ml-1">{item.vehicleModel}</span></span>
                        <span className="font-bold text-primary">R$ {item.totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-end mt-2">
                    <span className="font-black text-sm text-secondary">Soma em Produtos: R$ {inv.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            ))}
            {groupedInvoices.withInvoice.length === 0 && (
              <div className="text-center py-6 text-outline font-medium text-sm border border-dashed border-outline-variant/20 rounded-2xl">
                Nenhuma Nota Fiscal cadastrada
              </div>
            )}
          </div>

          <h3 className="font-bold text-lg text-secondary uppercase tracking-widest mb-4 mt-8 border-b border-outline-variant/10 pb-2">Entradas Avulsas (Sem Nota)</h3>
          <div className="space-y-3">
            {groupedInvoices.singles.slice(0, 15).map((entry, idx) => (
              <div key={idx} className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10 flex justify-between items-center shadow-sm">
                 <div className="min-w-0 flex-1 pr-2">
                    <h4 className="font-bold text-sm text-on-surface truncate">{entry.productName}</h4>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold truncate">{entry.quantity}x unidades • {entry.buyerName}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-black text-secondary">R$ {entry.totalValue.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
                    <p className="text-[9px] text-outline uppercase tracking-widest font-bold">{format(parseISO(entry.date), 'dd/MM/yyyy')}</p>
                 </div>
              </div>
            ))}
            {groupedInvoices.singles.length === 0 && (
              <div className="text-center py-6 text-outline font-medium text-sm border border-dashed border-outline-variant/20 rounded-2xl">
                Nenhuma entrada avulsa cadastrada
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const ExitsPage = ({ products, user }: { products: Product[], user: User }) => {
  const [recipient, setRecipient] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedItems, setSelectedItems] = useState<ExitItem[]>([]);
  const [loading, setLoading] = useState(false);

  const addItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (selectedItems.find(item => item.productId === productId)) return;

    setSelectedItems([...selectedItems, {
      productId,
      productName: product.name,
      quantity: 1,
      vehicleModel: product.vehicleModel || ''
    }]);
  };

  const updateItemQuantity = (productId: string, delta: number) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.productId !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !destination || selectedItems.length === 0) return;

    setLoading(true);
    try {
      const exitData = {
        recipient,
        destination,
        date: new Date().toISOString(),
        items: selectedItems,
        totalVolumes: selectedItems.reduce((acc, curr) => acc + curr.quantity, 0),
        authorUid: user.uid
      };

      await addDoc(collection(db, 'exits'), exitData);

      for (const item of selectedItems) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const productRef = doc(db, 'products', item.productId);
          await updateDoc(productRef, {
            stock: product.stock - item.quantity,
            lastUpdated: new Date().toISOString()
          });
        }
      }

      setRecipient('');
      setDestination('');
      setSelectedItems([]);
      alert('Saída registrada com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'exits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8 pb-12"
    >
      <section className="space-y-2">
        <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Logística Operacional</p>
        <h2 className="text-4xl font-black tracking-tighter text-on-surface">Saída de Estoque</h2>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-container-low p-6 rounded-3xl space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Quem Tirou a Peça?</label>
            <input 
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Nome de quem retirou"
              className="w-full bg-surface-container-lowest border-none rounded-2xl py-4 px-4 text-on-surface font-bold focus:ring-2 focus:ring-primary/10"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Qual Destino (Oficina)</label>
            <input 
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Oficina ou local de destino"
              className="w-full bg-surface-container-lowest border-none rounded-2xl py-4 px-4 text-on-surface font-bold focus:ring-2 focus:ring-primary/10"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm uppercase tracking-widest text-on-surface">Peças Selecionadas</h3>
            <select 
              onChange={(e) => {
                if(e.target.value) {
                  addItem(e.target.value);
                  e.target.value = "";
                }
              }}
              className="text-xs font-bold text-primary bg-primary/5 border-none rounded-full px-4 py-2 hover:bg-primary/10 cursor-pointer"
              value=""
            >
              <option value="">+ Adicionar Peça</option>
              {products.filter(p => p.stock > 0).map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.vehicleModel} (Estoque: {p.stock})</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {selectedItems.map(item => (
              <div key={item.productId} className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-center border border-outline-variant/10">
                <div className="flex-1">
                  <h4 className="font-bold text-on-surface text-sm">{item.productName}</h4>
                  <p className="text-[10px] font-bold text-secondary tracking-widest uppercase">{item.vehicleModel}</p>
                </div>
                <div className="flex items-center gap-3 bg-surface-container-low px-3 py-1.5 rounded-full">
                  <button type="button" onClick={() => updateItemQuantity(item.productId, -1)} className="text-primary font-bold">-</button>
                  <span className="text-sm font-black text-on-surface w-4 text-center">{item.quantity}</span>
                  <button type="button" onClick={() => updateItemQuantity(item.productId, 1)} className="text-primary font-bold">+</button>
                </div>
                <button type="button" onClick={() => removeItem(item.productId)} className="text-error">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
            {selectedItems.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-outline-variant/20 rounded-2xl">
                <p className="text-on-surface-variant font-medium text-sm">Nenhuma peça adicionada ainda.</p>
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading || selectedItems.length === 0}
          className="w-full bg-primary text-on-primary font-black py-5 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Registrar Saída'}
        </button>
      </form>
    </motion.div>
  );
};

const InventoryPage = ({ products, user }: { products: Product[], user: User }) => {
  const [filter, setFilter] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  
  // O inventário mostra apenas o que tem quantidade física real para conferência
  const productsWithStock = products.filter(p => p.stock > 0);

  const filteredProducts = productsWithStock.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase()) || 
    (p.vehicleModel || '').toLowerCase().includes(filter.toLowerCase())
  );

  const totalItems = productsWithStock.reduce((acc, p) => acc + p.stock, 0);
  const totalValue = productsWithStock.reduce((acc, p) => acc + (p.stock * p.unitValue), 0);

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setLoading(true);
    try {
      const productRef = doc(db, 'products', editingProduct.id);
      await updateDoc(productRef, {
        name: editingProduct.name,
        vehicleModel: editingProduct.vehicleModel,
        stock: Number(editingProduct.stock),
        unitValue: Number(editingProduct.unitValue),
        lastUpdated: new Date().toISOString()
      });
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-12"
    >
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <span className="text-on-surface-variant font-bold text-[11px] uppercase tracking-widest">Controle Geral</span>
          <h2 className="text-4xl font-black tracking-tighter text-on-surface">Conferência de Estoque</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-3xl flex flex-col justify-between shadow-sm border border-outline-variant/10">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-1">Total de Peças Físicas</p>
          <p className="text-primary text-3xl font-black tracking-tight">{totalItems} <span className="text-base font-bold">UN</span></p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-3xl flex flex-col justify-between shadow-sm border border-outline-variant/10">
          <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-1">Valor Estimado em Estoque</p>
          <p className="text-secondary text-2xl font-black tracking-tight">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
        <input 
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar produto ou veículo..."
          className="w-full bg-surface-container-high border-none rounded-2xl py-4 pl-12 pr-4 text-on-surface font-bold focus:ring-2 focus:ring-primary transition-all"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/10 shadow-sm flex gap-5 relative group">
            <button 
              onClick={() => setEditingProduct(product)}
              className="absolute top-4 right-4 text-outline/50 hover:text-primary transition-colors focus:outline-none"
            >
              <span className="material-symbols-outlined text-xl">edit</span>
            </button>
            <div className="w-20 h-20 rounded-2xl bg-surface-container overflow-hidden flex-shrink-0 flex items-center justify-center">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="material-symbols-outlined text-primary/30 text-4xl">inventory_2</span>
              )}
            </div>
            <div className="flex flex-col justify-between py-1 flex-grow pr-8">
              <div>
                <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">{product.vehicleModel}</span>
                <h3 className="text-lg font-bold text-on-surface leading-tight mt-1">{product.name}</h3>
              </div>
              <div className="flex justify-between items-end mt-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-secondary-container text-on-secondary-container">
                  {product.stock} em estoque
                </span>
                <span className="text-xs font-bold text-outline">Total: R$ {(product.unitValue * product.stock).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-10 opacity-50">
            <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
            <p className="font-bold text-sm">Nenhum produto com estoque encontrado.</p>
          </div>
        )}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-on-surface/20 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-outline-variant/10"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black tracking-tight">Editar Peça</h3>
              <button onClick={() => setEditingProduct(null)} className="p-2 -mr-2 text-outline hover:text-on-surface hover:bg-surface-container rounded-full transition-colors focus:outline-none">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary px-1">Nome do Produto</label>
                <input 
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-4 font-bold"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary px-1">Veículo / Modelo</label>
                <input 
                  value={editingProduct.vehicleModel}
                  onChange={e => setEditingProduct({...editingProduct, vehicleModel: e.target.value})}
                  className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-4 font-bold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary px-1">QTD Estoque</label>
                  <input 
                    type="number"
                    value={editingProduct.stock}
                    onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})}
                    className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-4 font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary px-1">Valor Unit. (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={editingProduct.unitValue}
                    onChange={e => setEditingProduct({...editingProduct, unitValue: Number(e.target.value)})}
                    className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-4 font-bold"
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary font-black py-5 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 mt-4"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

const MaintenancesPage = ({ products, user, role, maintenances }: { products: Product[], user: User, role: string, maintenances: Maintenance[] }) => {
  const [view, setView] = useState<'list' | 'create'>('list');
  
  // form fields
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [takenBy, setTakenBy] = useState('');
  const [workshop, setWorkshop] = useState('');
  const [mechanicName, setMechanicName] = useState('');
  const [exitDate, setExitDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [observation, setObservation] = useState('');

  const [selectedStockParts, setSelectedStockParts] = useState<ExitItem[]>([]);
  
  const [reqPartName, setReqPartName] = useState('');
  const [reqPartValue, setReqPartValue] = useState('');
  const [requestedParts, setRequestedParts] = useState<MaintenancePartRequested[]>([]);

  const [loading, setLoading] = useState(false);

  const addStockPart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (selectedStockParts.find(item => item.productId === productId)) return;
    setSelectedStockParts([...selectedStockParts, {
      productId,
      productName: product.name,
      quantity: 1,
      vehicleModel: product.vehicleModel || ''
    }]);
  };

  const updateStockPartQty = (productId: string, delta: number) => {
    setSelectedStockParts(selectedStockParts.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeStockPart = (productId: string) => {
    setSelectedStockParts(selectedStockParts.filter(item => item.productId !== productId));
  };

  const addRequestedPart = () => {
    if (!reqPartName || !reqPartValue) return;
    setRequestedParts([...requestedParts, {
      id: Date.now().toString(),
      name: reqPartName,
      value: Number(reqPartValue)
    }]);
    setReqPartName('');
    setReqPartValue('');
  };

  const removeRequestedPart = (id: string) => {
    setRequestedParts(requestedParts.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiclePlate || !vehicleModel || !takenBy || !workshop || !mechanicName) return;
    setLoading(true);
    try {
      const maintenanceData = {
        vehiclePlate, vehicleModel, date: new Date().toISOString(), exitDate, takenBy, workshop, mechanicName,
        partsTaken: selectedStockParts, partsRequested: requestedParts, deliveryDate, observation, authorUid: user.uid
      };
      await addDoc(collection(db, 'maintenances'), maintenanceData);
      for (const item of selectedStockParts) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const productRef = doc(db, 'products', item.productId);
          await updateDoc(productRef, { stock: product.stock - item.quantity, lastUpdated: new Date().toISOString() });
        }
      }
      setVehiclePlate(''); setVehicleModel(''); setTakenBy(''); setWorkshop(''); setMechanicName(''); 
      setExitDate(''); setDeliveryDate(''); setObservation(''); setSelectedStockParts([]); setRequestedParts([]);
      alert('Revisão/Manutenção registrada com sucesso!');
      setView('list');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'maintenances');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 pb-12">
      <section className="space-y-2 flex justify-between items-center">
        <div>
          <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Oficina</p>
          <h2 className="text-4xl font-black tracking-tighter text-on-surface">Revisões</h2>
        </div>
        <div>
          {view === 'list' ? (
            <button onClick={() => setView('create')} className="bg-primary text-on-primary font-bold py-2 px-4 rounded-xl shadow-sm text-sm">
              + Nova OS
            </button>
          ) : (
            <button onClick={() => setView('list')} className="bg-surface-container-high text-on-surface font-bold py-2 px-4 rounded-xl shadow-sm text-sm">
              Voltar
            </button>
          )}
        </div>
      </section>

      {view === 'create' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface-container-low p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-primary">Dados do Serviço</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Placa do Veículo</label>
                <input type="text" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} required className="w-full bg-surface-container-lowest border-none rounded-2xl py-3 px-4 text-on-surface font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Modelo do Veículo</label>
                <input type="text" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} required className="w-full bg-surface-container-lowest border-none rounded-2xl py-3 px-4 text-on-surface font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Quem levou a moto?</label>
                <input type="text" value={takenBy} onChange={e => setTakenBy(e.target.value)} required className="w-full bg-surface-container-lowest border-none rounded-2xl py-3 px-4 text-on-surface font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Oficina</label>
                <input type="text" value={workshop} onChange={e => setWorkshop(e.target.value)} required className="w-full bg-surface-container-lowest border-none rounded-2xl py-3 px-4 text-on-surface font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Nome do Mecânico</label>
                <input type="text" value={mechanicName} onChange={e => setMechanicName(e.target.value)} required className="w-full bg-surface-container-lowest border-none rounded-2xl py-3 px-4 text-on-surface font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Data de Saída / Ida</label>
                <input type="date" value={exitDate} onChange={e => setExitDate(e.target.value)} required className="w-full bg-surface-container-lowest border-none rounded-2xl py-3 px-4 text-on-surface font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Data de Entrega / Pronta</label>
                <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full bg-surface-container-lowest border-none rounded-2xl py-3 px-4 text-on-surface font-bold" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-1">Observação</label>
                <textarea value={observation} onChange={e => setObservation(e.target.value)} className="w-full bg-surface-container-lowest border-none rounded-2xl py-3 px-4 text-on-surface font-bold min-h-[80px]" />
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-secondary">Peças do Estoque (Baixa de Produto)</h3>
              <select onChange={e => { if(e.target.value) { addStockPart(e.target.value); e.target.value = ""; } }} className="text-xs font-bold text-primary bg-primary/5 border-none rounded-full px-4 py-2 hover:bg-primary/10 cursor-pointer" value="">
                <option value="">+ Selecionar do Estoque</option>
                {products.filter(p => p.stock > 0).map(p => <option key={p.id} value={p.id}>{p.name} - {p.vehicleModel} (Qtd: {p.stock})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              {selectedStockParts.map(item => (
                <div key={item.productId} className="bg-surface-container-lowest p-3 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">{item.productName}</h4>
                    <p className="text-[10px] text-on-surface-variant uppercase">{item.vehicleModel}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-container-low px-2 py-1 rounded-full">
                    <button type="button" onClick={() => updateStockPartQty(item.productId, -1)} className="text-secondary font-bold px-1">-</button>
                    <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                    <button type="button" onClick={() => updateStockPartQty(item.productId, 1)} className="text-secondary font-bold px-1">+</button>
                  </div>
                  <button type="button" onClick={() => removeStockPart(item.productId)} className="text-error"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>
              ))}
              {selectedStockParts.length === 0 && <p className="text-xs text-on-surface-variant text-center opacity-70">Nenhuma peça do estoque utilizada.</p>}
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-tertiary-fixed-dim">Peças Solicitadas pelo Mecânico (Compradas Fora)</h3>
            <div className="flex gap-2">
              <input type="text" value={reqPartName} onChange={e => setReqPartName(e.target.value)} placeholder="Nome da peça" className="flex-grow bg-surface-container-lowest border-none rounded-xl py-3 px-4 text-sm font-bold" />
              <input type="number" step="0.01" value={reqPartValue} onChange={e => setReqPartValue(e.target.value)} placeholder="Valor R$" className="w-28 bg-surface-container-lowest border-none rounded-xl py-3 px-4 text-sm font-bold" />
              <button type="button" onClick={addRequestedPart} className="bg-tertiary-fixed-dim text-on-tertiary-fixed font-bold px-4 rounded-xl text-sm">+</button>
            </div>
            <div className="space-y-2 mt-4">
              {requestedParts.map(item => (
                <div key={item.id} className="bg-surface-container-lowest p-3 rounded-2xl flex items-center justify-between">
                  <span className="font-bold text-sm">{item.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-tertiary-fixed-dim">R$ {(item.value || 0).toFixed(2)}</span>
                    <button type="button" onClick={() => removeRequestedPart(item.id)} className="text-error"><span className="material-symbols-outlined text-sm">delete</span></button>
                  </div>
                </div>
              ))}
              {requestedParts.length === 0 && <p className="text-xs text-on-surface-variant text-center opacity-70">Nenhuma peça adicional solicitada.</p>}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary text-on-primary font-black py-5 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            {loading ? 'Processando...' : 'Registrar OS de Manutenção'}
          </button>
        </form>
      )}

      {view === 'list' && (
        <div className="space-y-4">
          {maintenances.map(m => (
            <div key={m.id} className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/10 shadow-sm space-y-3">
              <div className="flex justify-between items-start border-b border-outline-variant/10 pb-3">
                <div>
                  <h3 className="font-black text-lg text-primary uppercase tracking-tight">{m.vehiclePlate}</h3>
                  <p className="text-xs font-bold text-on-surface-variant">{m.vehicleModel} • {m.workshop}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{m.date ? format(parseISO(m.date), 'dd/MM/yyyy HH:mm') : ''}</span>
                  <p className="text-xs font-bold text-secondary mt-1">Mecânico: {m.mechanicName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Peças Estoque</p>
                  {m.partsTaken && m.partsTaken.length > 0 ? (
                    <ul className="list-disc list-inside text-on-surface ml-1 mt-1 font-medium">
                      {m.partsTaken.map((p, i) => <li key={i}>{p.quantity}x {p.productName}</li>)}
                    </ul>
                  ) : <span className="text-outline italic">Nenhuma</span>}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Peças Compradas</p>
                  {m.partsRequested && m.partsRequested.length > 0 ? (
                    <ul className="list-disc list-inside text-tertiary-fixed-dim ml-1 mt-1 font-bold">
                      {m.partsRequested.map((p, i) => <li key={i}>{p.name} (R$ {Number(p.value).toFixed(2)})</li>)}
                    </ul>
                  ) : <span className="text-outline italic">Nenhuma</span>}
                </div>
              </div>
              <div className="pt-2">
                {m.observation && <p className="text-xs text-on-surface-variant italic border-l-2 border-outline/30 pl-2">Obs: {m.observation}</p>}
                <div className="flex gap-4 mt-2">
                  {m.exitDate && <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Ida para Oficina: {m.exitDate.split('-').reverse().join('/')}</p>}
                  {m.deliveryDate && <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Pronta / Entregue: {m.deliveryDate.split('-').reverse().join('/')}</p>}
                </div>
                <p className="text-[10px] font-bold text-outline mt-1 tracking-widest">Levado por: {m.takenBy}</p>
              </div>
            </div>
          ))}
          {maintenances.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <span className="material-symbols-outlined text-4xl mb-2">handyman</span>
              <p className="font-bold text-sm">Nenhuma revisão registrada.</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin'|'monitor'>('admin');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [exits, setExits] = useState<Exit[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.email?.toLowerCase().includes('monitor')) {
        setUserRole('monitor');
      } else {
        setUserRole('admin');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubProducts = onSnapshot(
      query(collection(db, 'products'), orderBy('name')),
      (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'products')
    );

    const unsubEntries = onSnapshot(
      query(collection(db, 'entries'), orderBy('date', 'desc')),
      (snapshot) => {
        setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entry)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'entries')
    );

    const unsubExits = onSnapshot(
      query(collection(db, 'exits'), orderBy('date', 'desc')),
      (snapshot) => {
        setExits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exit)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'exits')
    );

    const unsubMaintenances = onSnapshot(
      query(collection(db, 'maintenances'), orderBy('date', 'desc')),
      (snapshot) => {
        setMaintenances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Maintenance)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'maintenances')
    );

    return () => {
      unsubProducts();
      unsubEntries();
      unsubExits();
      unsubMaintenances();
    };
  }, [user]);

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-surface text-on-surface font-body">
          <Header user={user} />
          <main className="px-4 sm:px-6 lg:px-8 pt-4 pb-32 max-w-5xl mx-auto w-full transition-all">
            <AnimatePresence mode="wait">
              <Routes>
                {userRole === 'monitor' ? (
                  <>
                    <Route path="/maintenances" element={<MaintenancesPage products={products} user={user} role={userRole} maintenances={maintenances} />} />
                    <Route path="*" element={<Navigate to="/maintenances" />} />
                  </>
                ) : (
                  <>
                    <Route path="/" element={<Dashboard products={products} entries={entries} exits={exits} />} />
                    <Route path="/entries" element={<EntriesPage products={products} user={user} entries={entries} />} />
                    <Route path="/exits" element={<ExitsPage products={products} user={user} />} />
                    <Route path="/inventory" element={<InventoryPage products={products} user={user} />} />
                    <Route path="/maintenances" element={<MaintenancesPage products={products} user={user} role={userRole} maintenances={maintenances} />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </>
                )}
              </Routes>
            </AnimatePresence>
          </main>
          <Navbar user={user} userRole={userRole} />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
