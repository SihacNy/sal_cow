import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  AlertCircle, 
  ArrowUpDown,
  Filter,
  UserPlus,
  MoreVertical,
  Calendar,
  ChevronRight,
  Activity,
  Users
} from 'lucide-react';
import { Cow, WeightRecord } from '../../types';

interface CattleRecordsProps {
  cows: Cow[];
  weights: WeightRecord[];
  onAddCow: (cow: Omit<Cow, 'id' | 'createdAt'>) => Promise<boolean>;
  onEditCow: (id: string, cowData: Partial<Cow>) => Promise<boolean>;
  onDeleteCow: (id: string) => Promise<boolean>;
  onSelectCow: (id: string) => void;
}

export default function CattleRecordsView({
  cows,
  weights,
  onAddCow,
  onEditCow,
  onDeleteCow,
  onSelectCow
}: CattleRecordsProps) {
  const { t } = useTranslation();
  
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [breedFilter, setBreedFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'cowId' | 'name' | 'birthDate'>('cowId');
  const [sortAsc, setSortAsc] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCow, setEditingCow] = useState<Cow | null>(null);

  const [formCowId, setFormCowId] = useState('');
  const [formName, setFormName] = useState('');
  const [formBreed, setFormBreed] = useState('Brahman');
  const [formGender, setFormGender] = useState<'Female' | 'Male'>('Female');
  const [formBirthDate, setFormBirthDate] = useState('2024-01-01');
  const [formImage, setFormImage] = useState('');
  const [formError, setFormError] = useState('');

  const breeds = Array.from(new Set(cows.map(c => c.breed)));

  const getLatestWeighInfo = (cowLabel: string) => {
    const cowWeights = weights.filter(w => w.cowId === cowLabel);
    if (cowWeights.length === 0) return { weight: '—', date: 'No records' };
    const sorted = [...cowWeights].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return {
      weight: `${sorted[0].weight.toFixed(1)} kg`,
      date: new Date(sorted[0].timestamp).toLocaleDateString()
    };
  };

  const handleOpenAddModal = () => {
    setEditingCow(null);
    setFormCowId(`COW-${Math.floor(100 + Math.random() * 900)}`);
    setFormName('');
    setFormBreed('Brahman');
    setFormGender('Female');
    setFormBirthDate('2024-01-01');
    setFormImage('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      cowId: formCowId,
      name: formName,
      breed: formBreed,
      gender: formGender,
      birthDate: formBirthDate,
      image: formImage || 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=500'
    };
    const success = editingCow ? await onEditCow(editingCow.cowId, payload) : await onAddCow(payload);
    if (success) setIsModalOpen(false);
  };

  const processedCows = cows
    .filter(cow => {
      const matchSearch = cow.cowId.toLowerCase().includes(search.toLowerCase()) || cow.name.toLowerCase().includes(search.toLowerCase());
      const matchGender = genderFilter === 'ALL' || cow.gender.toUpperCase() === genderFilter;
      const matchBreed = breedFilter === 'ALL' || cow.breed === breedFilter;
      return matchSearch && matchGender && matchBreed;
    });

  return (
    <div className="space-y-10 fade-in pb-12">
      {/* Premium Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 className="heading-xl">Cattle Registry</h2>
           <div className="flex items-center gap-3 mt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#4D8E7D]"></div>
              <p className="text-xs text-[#A0AEC0] font-black uppercase tracking-[0.2em] leading-none underline-offset-4 decoration-emerald-200">Database & Registry</p>
           </div>
        </div>
        
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-3 px-8 py-5 bg-[#1A202C] text-white rounded-[2rem] text-xs font-bold uppercase tracking-widest shadow-2xl shadow-gray-900/20 hover:scale-[1.02] transition-all active:scale-95 group"
        >
          <div className="p-1.5 bg-white/10 rounded-full group-hover:rotate-90 transition-transform">
             <UserPlus size={18} />
          </div>
          <span>Register New Cattle</span>
        </button>
      </div>

      {/* Advanced Filter Console */}
      <div className="human-card !p-3 flex flex-col lg:flex-row items-center gap-2">
         <div className="relative flex-1 group w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A0AEC0] group-focus-within:text-[#4D8E7D] transition-colors" size={20} />
            <input 
               type="text" 
               placeholder="Search by ID or Name..." 
               className="w-full bg-[#F8FAF9] border-none rounded-2xl py-4 pl-14 pr-6 text-sm font-medium focus:ring-0 placeholder:text-[#A0AEC0]"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative w-full lg:w-48">
               <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AEC0]" size={16} />
               <select 
                 className="w-full bg-white border border-[#E2E8F0] rounded-2xl py-4 pl-12 pr-8 text-xs font-bold uppercase tracking-wider appearance-none cursor-pointer hover:bg-[#F8FAF9] transition-colors"
                 value={breedFilter}
                 onChange={(e) => setBreedFilter(e.target.value)}
               >
                  <option value="ALL">All Breeds</option>
                  {breeds.map(b => <option key={b} value={b}>{b}</option>)}
               </select>
            </div>
            <div className="relative w-full lg:w-48">
               <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0AEC0]" size={16} />
               <select 
                 className="w-full bg-white border border-[#E2E8F0] rounded-2xl py-4 pl-12 pr-8 text-xs font-bold uppercase tracking-wider appearance-none cursor-pointer hover:bg-[#F8FAF9] transition-colors"
                 value={genderFilter}
                 onChange={(e) => setGenderFilter(e.target.value)}
               >
                  <option value="ALL">All Genders</option>
                  <option value="FEMALE">Females</option>
                  <option value="MALE">Males</option>
               </select>
            </div>
         </div>
      </div>

      {/* Registry Table */}
      <div className="human-card !p-0 overflow-hidden shadow-2xl shadow-emerald-900/5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-[#E2E8F0] bg-[#F8FAF9]/50">
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-[#A0AEC0]">Cattle Data</th>
                <th className="py-6 px-6 text-[10px] font-black uppercase tracking-widest text-[#A0AEC0]">Classification</th>
                <th className="py-6 px-6 text-[10px] font-black uppercase tracking-widest text-[#A0AEC0]">Latest Weigh</th>
                <th className="py-6 px-6 text-[10px] font-black uppercase tracking-widest text-[#A0AEC0]">Health status</th>
                <th className="py-6 px-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {processedCows.map((cow) => {
                const weighInfo = getLatestWeighInfo(cow.cowId);
                return (
                  <tr key={cow.cowId} className="group hover:bg-[#E8F3F1]/30 transition-all">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-5">
                         <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#E2E8F0] overflow-hidden group-hover:border-[#4D8E7D] transition-colors p-0.5">
                            <img src={cow.image || 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=50'} alt={cow.name} className="w-full h-full rounded-xl object-cover" />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-[#1A202C]">{cow.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[10px] font-black uppercase tracking-widest text-[#4D8E7D] bg-[#E8F3F1] px-2 py-0.5 rounded-md">{cow.cowId}</span>
                               <span className="text-[10px] text-[#A0AEC0] flex items-center gap-1"><Calendar size={10} /> Born {new Date(cow.birthDate).getFullYear()}</span>
                            </div>
                         </div>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex flex-col gap-1.5">
                         <span className="text-xs font-bold text-[#1A202C]">{cow.breed}</span>
                         <div className={`w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                            cow.gender === 'Female' ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'
                         }`}>
                           {cow.gender === 'Female' ? 'Parent Female' : 'Male Breeder'}
                         </div>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex flex-col gap-1">
                         <p className="text-xs font-black text-[#1A202C]">{weighInfo.weight}</p>
                         <p className="text-[10px] text-[#A0AEC0]">{weighInfo.date}</p>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-2xl w-fit">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest">In Range</span>
                       </div>
                    </td>
                    <td className="py-6 px-8 text-right">
                       <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => onSelectCow(cow.cowId)} className="p-3 bg-white shadow-lg rounded-2xl text-[#A0AEC0] hover:text-[#4D8E7D] transition-colors"><Eye size={18} /></button>
                          <button onClick={() => { 
                            setEditingCow(cow); 
                            setFormCowId(cow.cowId);
                            setFormName(cow.name);
                            setFormBreed(cow.breed);
                            setFormGender(cow.gender);
                            setFormBirthDate(new Date(cow.birthDate).toISOString().split('T')[0]);
                            setFormImage(cow.image || '');
                            setIsModalOpen(true); 
                          }} className="p-3 bg-white shadow-lg rounded-2xl text-[#A0AEC0] hover:text-[#4D8E7D] transition-colors"><Edit3 size={18} /></button>
                          <button onClick={() => onDeleteCow(cow.cowId)} className="p-3 bg-white shadow-lg rounded-2xl text-[#A0AEC0] hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Modal (Human UI Version) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#1A202C]/60 backdrop-blur-md fade-in">
           <div className="human-card !p-10 w-full max-w-2xl shadow-3xl bg-white relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-2 text-[#A0AEC0] hover:text-rose-500 transition-colors">
                 <Trash2 size={24} />
              </button>

              <h3 className="heading-xl text-3xl mb-8">{editingCow ? 'Edit Cattle Entity' : 'Register New Entity'}</h3>
              
              <form onSubmit={handleFormSubmit} className="space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Cattle Tag ID</label>
                       <input value={formCowId} onChange={e => setFormCowId(e.target.value)} className="w-full bg-[#F8FAF9] border-none rounded-2xl py-4 px-6 text-sm font-bold placeholder:text-gray-300" placeholder="e.g. KH-999" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Given Name</label>
                       <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-[#F8FAF9] border-none rounded-2xl py-4 px-6 text-sm font-bold" placeholder="e.g. Bella" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Breed / Classification</label>
                       <select 
                         value={formBreed} 
                         onChange={e => setFormBreed(e.target.value)} 
                         className="w-full bg-[#F8FAF9] border-none rounded-2xl py-4 px-6 text-sm font-bold"
                       >
                         <option value="Brahman">Brahman</option>
                         <option value="Angus">Angus</option>
                         <option value="Hereford">Hereford</option>
                         <option value="Holstein">Holstein</option>
                         <option value="Local Mixed">Local Mixed</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Gender</label>
                       <div className="flex bg-[#F8FAF9] p-1 rounded-2xl">
                          <button 
                            type="button" 
                            onClick={() => setFormGender('Female')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formGender === 'Female' ? 'bg-white shadow-sm text-[#4D8E7D]' : 'text-[#A0AEC0]'}`}
                          >Female</button>
                          <button 
                            type="button" 
                            onClick={() => setFormGender('Male')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formGender === 'Male' ? 'bg-white shadow-sm text-[#4D8E7D]' : 'text-[#A0AEC0]'}`}
                          >Male</button>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0]">Date of Birth</label>
                    <div className="relative">
                       <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A0AEC0]" size={18} />
                       <input 
                         type="date" 
                         value={formBirthDate} 
                         onChange={e => setFormBirthDate(e.target.value)} 
                         className="w-full bg-[#F8FAF9] border-none rounded-2xl py-4 pl-14 pr-6 text-sm font-bold" 
                       />
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button type="submit" className="flex-1 py-5 bg-[#4D8E7D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all">Commit to Records</button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-5 bg-[#F8FAF9] text-[#A0AEC0] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E2E8F0] transition-colors">Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
