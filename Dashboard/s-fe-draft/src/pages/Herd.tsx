import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, X, ArrowUpRight, ArrowDownRight, CheckCircle2, MoreVertical, Calendar, Heart, FileText, Filter, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import cowIcon from '../assets/cow.png';

const mockHerd = [
  { id: 'TAG-8921', weight: 1450, status: 'overweight', lastSync: '10 mins ago', trend: 'up', age: '3 yrs', breed: 'Angus', health: 'Good', gender: 'Male' },
  { id: 'TAG-1142', weight: 1120, status: 'normal', lastSync: '45 mins ago', trend: 'stable', age: '2 yrs', breed: 'Hereford', health: 'Excellent', gender: 'Female' },
  { id: 'TAG-9932', weight: 1520, status: 'critical', lastSync: '1 hour ago', trend: 'up', age: '4 yrs', breed: 'Angus', health: 'Attention Required', gender: 'Male' },
  { id: 'TAG-0021', weight: 1180, status: 'normal', lastSync: '2 hours ago', trend: 'down', age: '2.5 yrs', breed: 'Brahman', health: 'Good', gender: 'Female' },
  { id: 'TAG-4431', weight: 1390, status: 'warning', lastSync: '3 hours ago', trend: 'up', age: '3.5 yrs', breed: 'Angus', health: 'Monitor', gender: 'Female' },
  { id: 'TAG-7721', weight: 1205, status: 'normal', lastSync: '5 hours ago', trend: 'stable', age: '2 yrs', breed: 'Hereford', health: 'Good', gender: 'Male' },
  { id: 'TAG-8812', weight: 1195, status: 'normal', lastSync: '5 hours ago', trend: 'down', age: '2 yrs', breed: 'Angus', health: 'Good', gender: 'Female' },
];

const mockHistoryData = [
  { month: 'Jan', weight: 1100 },
  { month: 'Feb', weight: 1150 },
  { month: 'Mar', weight: 1200 },
  { month: 'Apr', weight: 1250 },
  { month: 'May', weight: 1350 },
  { month: 'Jun', weight: 1400 },
  { month: 'Jul', weight: 1450 },
];

const mockScales = [
  { id: 'SCALE-01', name: 'North Pasture Gate' },
  { id: 'SCALE-02', name: 'Barn A Entrance' },
  { id: 'SCALE-03', name: 'South Water Trough' },
];

interface HerdProps {
  onNavigateToScale?: (scaleId: string, cowId?: string) => void;
}

export function Herd({ onNavigateToScale }: HerdProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCow, setSelectedCow] = useState<typeof mockHerd[0] | null>(null);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [genderFilter, setGenderFilter] = useState('All');
  const [breedFilter, setBreedFilter] = useState('All');
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredHerd = mockHerd.filter(cow => {
    const matchesSearch = cow.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t(`status.${cow.status}`).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'All' || cow.gender === genderFilter;
    const matchesBreed = breedFilter === 'All' || cow.breed === breedFilter;
    return matchesSearch && matchesGender && matchesBreed;
  });

  return (
    <div className="relative h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('herd.title')}</h2>
          <p className="text-gray-500 mt-1">{t('herd.subtitle', 'Manage your livestock, view records, and track health.')}</p>
        </div>
        <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
          <Plus size={20} />
          <span>{t('herd.addCow', 'Add Cow')}</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center flex-1">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('herd.searchPlaceholder', 'Search by Tag ID or Status...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-0 bg-gray-50 font-sans"
            />
          </div>
          
          <div className="relative w-full sm:w-auto" ref={filterRef}>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex w-full sm:w-auto items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              <Filter size={16} />
              <span>{t('herd.filter', 'Filter')}</span>
              {(genderFilter !== 'All' || breedFilter !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-green-500 ml-1"></span>
              )}
            </button>
            
            {showFilters && (
              <div className="absolute top-full left-0 mt-2 w-full sm:w-[26rem] bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
                    <select 
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-0"
                    >
                      <option value="All">{t('herd.filterAllGenders', 'All Genders')}</option>
                      <option value="Male">{t('herd.filterMale', 'Male')}</option>
                      <option value="Female">{t('herd.filterFemale', 'Female')}</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Breed</label>
                    <select 
                      value={breedFilter}
                      onChange={(e) => setBreedFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-0"
                    >
                      <option value="All">{t('herd.filterAllBreeds', 'All Breeds')}</option>
                      <option value="Angus">Angus</option>
                      <option value="Hereford">Hereford</option>
                      <option value="Brahman">Brahman</option>
                    </select>
                  </div>
                </div>
                {(genderFilter !== 'All' || breedFilter !== 'All') && (
                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <button 
                        onClick={() => {
                          setGenderFilter('All');
                          setBreedFilter('All');
                          setShowFilters(false);
                        }}
                        className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        <button className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto">
          <Download size={16} />
          <span>{t('herd.export', 'Export')}</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('herd.table.tagId', 'Tag ID')}</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('herd.table.weight', 'Weight (lbs)')}</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('herd.table.status', 'Status')}</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('herd.table.lastSync', 'Last Sync')}</th>
                <th className="py-4 px-6 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('herd.table.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredHerd.length > 0 ? filteredHerd.map((cow) => (
                <tr key={cow.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setSelectedCow(cow)}>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                         <div className="w-4 h-4 bg-current" style={{ WebkitMaskImage: `url(${cowIcon})`, maskImage: `url(${cowIcon})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
                      </div>
                      <span className="font-semibold text-gray-900">{cow.id}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900">{cow.weight}</span>
                      {cow.trend === 'up' ? (
                        <ArrowUpRight size={16} className="text-red-500" />
                      ) : cow.trend === 'down' ? (
                        <ArrowDownRight size={16} className="text-green-500" />
                      ) : (
                        <CheckCircle2 size={16} className="text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      cow.status === 'critical' ? 'bg-red-100 text-red-700' :
                      cow.status === 'overweight' || cow.status === 'warning' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {t(`status.${cow.status}`)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">{cow.lastSync}</td>
                  <td className="py-4 px-6 text-right">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" onClick={(e) => { e.stopPropagation(); /* Menu logic */ }}>
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    {t('herd.noResults', 'No cows found matching your search.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Detail View */}
      {selectedCow && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedCow(null)} />
          <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-gray-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm border border-green-200">
                   <div className="w-6 h-6 bg-current" style={{ WebkitMaskImage: `url(${cowIcon})`, maskImage: `url(${cowIcon})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedCow.id}</h2>
                  <p className="text-sm text-gray-500">{selectedCow.breed} • {selectedCow.age}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCow(null)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center space-x-2 text-gray-500 mb-2">
                    <FileText size={16} />
                    <span className="text-sm font-medium">{t('herd.detail.currentWeight', 'Current Weight')}</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-gray-900">{selectedCow.weight}</span>
                    <span className="text-sm text-gray-500">lbs</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center space-x-2 text-gray-500 mb-2">
                    <Heart size={16} />
                    <span className="text-sm font-medium">{t('herd.detail.healthStatus', 'Health Status')}</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{selectedCow.health}</div>
                </div>
              </div>

              {/* Chart */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">{t('herd.detail.weightHistory', 'Weight History (YTD)')}</h3>
                <div className="h-64 w-full bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockHistoryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#16a34a', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <button className="px-4 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors shadow-sm text-center">
                  {t('herd.detail.editRecord', 'Edit Record')}
                </button>
                <button 
                  onClick={() => setShowScaleModal(true)}
                  className="px-4 py-3 bg-green-600 border border-transparent text-white hover:bg-green-700 rounded-xl font-medium transition-colors shadow-sm text-center"
                >
                  {t('herd.detail.addWeighIn', 'Add Weigh-in')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Scale Selection Modal */}
      {showScaleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Select Scale</h3>
                <p className="text-sm text-gray-500 mt-1">Choose a scale for weigh-in</p>
              </div>
              <button onClick={() => setShowScaleModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {mockScales.map(scale => (
                <button
                  key={scale.id}
                  onClick={() => {
                    const cowId = selectedCow?.id;
                    setShowScaleModal(false);
                    setSelectedCow(null);
                    onNavigateToScale?.(scale.id, cowId);
                  }}
                  className="w-full flex justify-between items-center p-4 hover:bg-green-50 rounded-xl border border-transparent hover:border-green-100 transition-colors group text-left"
                >
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-green-700">{scale.name}</div>
                    <div className="text-sm text-gray-500 font-mono mt-0.5">{scale.id}</div>
                  </div>
                  <ArrowUpRight size={20} className="text-gray-300 group-hover:text-green-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
