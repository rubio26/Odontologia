import { useState, useEffect } from 'react';
import { MapPin, Clock, Calendar as CalendarIcon, Phone, CheckCircle2, ChevronLeft, ChevronRight, User, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const HybridAgenda = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date()); // For month navigation
  const [todayApts, setTodayApts] = useState<any[]>([]);
  const [tomorrowApts, setTomorrowApts] = useState<any[]>([]);
  const [busyDays, setBusyDays] = useState<Set<string>>(new Set());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [showOptionsId, setShowOptionsId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, [selectedDate, viewDate.getMonth(), viewDate.getFullYear()]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchAppointments(),
      fetchMonthActivity()
    ]);
  };

  const fetchAppointments = async () => {
    try {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(start);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (id, full_name, phone),
          clinics (id, name, address)
        `)
        .gte('start_time', start.toISOString())
        .lt('start_time', dayAfter.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      if (data) {
        const tPath = start.toISOString().split('T')[0];
        const tmPath = tomorrow.toISOString().split('T')[0];
        
        setTodayApts(data.filter(a => a.start_time.startsWith(tPath)));
        setTomorrowApts(data.filter(a => a.start_time.startsWith(tmPath)));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchMonthActivity = async () => {
    try {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const firstDay = new Date(year, month, 1).toISOString();
      const lastDay = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const { data } = await supabase
        .from('appointments')
        .select('start_time')
        .gte('start_time', firstDay)
        .lte('start_time', lastDay);

      if (data) {
        const days = new Set(data.map(a => a.start_time.split('T')[0]));
        setBusyDays(days);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // Padding for first week
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`pad-${i}`} className="calendar-day empty"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedDate.toISOString().startsWith(dateStr);
      const hasApts = busyDays.has(dateStr);

      days.push(
        <div 
          key={d} 
          className={`calendar-day ${isSelected ? 'selected' : ''}`}
          onClick={() => setSelectedDate(new Date(year, month, d))}
        >
          <span className="day-number">{d}</span>
          {hasApts && <div className="gold-dot"></div>}
        </div>
      );
    }

    return (
      <div className="calendar-container card glass mt-4">
        <header className="calendar-header">
          <button className="btn glass p-2" onClick={() => setViewDate(new Date(year, month - 1, 1))}><ChevronLeft size={18} /></button>
          <h3 className="text-gold">{monthNames[month]} {year}</h3>
          <button className="btn glass p-2" onClick={() => setViewDate(new Date(year, month + 1, 1))}><ChevronRight size={18} /></button>
        </header>
        <div className="calendar-grid">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const updateAptStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
      if (error) throw error;
      
      const updater = (prev: any[]) => prev.map(a => a.id === id ? { ...a, status } : a);
      setTodayApts(updater);
      setTomorrowApts(updater);
      setConfirmingId(null);
      setShowOptionsId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleWhatsApp = (apt: any, isToday: boolean) => {
    const patientName = apt.patients?.full_name || 'Paciente';
    const time = new Date(apt.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const location = apt.clinics?.name || 'el consultorio';
    const phone = apt.patients?.phone;
    
    if (!phone) {
      alert('El paciente no tiene número de teléfono registrado.');
      return;
    }

    const emoji = "✨";
    let message = "";
    if (isToday) {
      message = `${emoji} Hola ${patientName}, te recordamos tu cita de hoy a las ${time} hs en ${location}. ¿Podrás asistir? ${emoji}`;
    } else {
      message = `${emoji} Hola ${patientName}, te recordamos tu cita de mañana a las ${time} hs en ${location}. ¿Nos confirmas tu asistencia? ${emoji}`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const renderAptCard = (apt: any, isToday: boolean = true) => {
    const isConfirmed = apt.status === 'confirmed';
    const isCancelled = apt.status === 'cancelled';

    return (
      <div 
        key={apt.id} 
        className={`apt-card glass relative ${isConfirmed ? 'is-confirmed' : ''} ${isCancelled ? 'is-cancelled' : ''}`}
        style={{ borderLeft: `3px solid ${apt.type === 'delivery' ? 'var(--primary)' : 'var(--success)'}` }}
      >
        <div className="apt-info">
          <div className="apt-time-row">
            <Clock size={14} color={isConfirmed ? 'black' : 'var(--primary)'} />
            <span className="apt-time">{new Date(apt.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs</span>
            <span className={`badge ${apt.type === 'delivery' ? 'badge-delivery' : 'badge-clinic'}`}>{apt.type === 'delivery' ? 'D' : 'C'}</span>
          </div>
          
          <div>
            <h4 
              className={`apt-patient cursor-pointer hover:underline ${isConfirmed ? 'text-black' : 'text-gold'}`}
              onClick={() => setConfirmingId(apt.id)}
            >
              {apt.patients?.full_name}
            </h4>
          </div>

          <div className="apt-meta">
            <MapPin size={12} />
            <span className={isConfirmed ? 'text-black opacity-70' : ''}>
              {apt.type === 'clinic' ? apt.clinics?.name : (apt.clinics?.name || 'Delivery')}
            </span>
          </div>
        </div>

        {confirmingId === apt.id && (
          <div className="confirm-bubble glass">
            <p>¿Confirmó?</p>
            <div className="flex gap-2 mt-2">
              <button className="confirm-btn si" onClick={() => updateAptStatus(apt.id, 'confirmed')}>SÍ</button>
              <button className="confirm-btn no" onClick={() => { setConfirmingId(null); setShowOptionsId(apt.id); }}>NO</button>
            </div>
          </div>
        )}

        {showOptionsId === apt.id && (
          <div className="confirm-bubble options glass">
            <button className="option-item" onClick={() => navigate('/new-appointment')}>Reagendar</button>
            <button className="option-item text-error" onClick={() => updateAptStatus(apt.id, 'cancelled')}>Cancelar</button>
            <button className="option-item close" onClick={() => setShowOptionsId(null)}>Cerrar</button>
          </div>
        )}

        <div className="apt-actions">
          <button className={`btn ${isConfirmed ? 'btn-white' : 'btn-primary'} btn-icon`} title="Confirmar Llegada" onClick={() => navigate('/patients', { state: { selectedPatientId: apt.patient_id, autoOpenTab: 'evolution' } })}>
            <CheckCircle2 size={16} />
          </button>
          <button className="btn btn-outline btn-icon" style={{ borderColor: isConfirmed ? 'rgba(0,0,0,0.2)' : '' }} title="WhatsApp" onClick={() => handleWhatsApp(apt, isToday)}>
            <MessageCircle size={16} color={isConfirmed ? 'black' : 'var(--success)'} />
          </button>
          <button className="btn btn-outline btn-icon" style={{ borderColor: isConfirmed ? 'rgba(0,0,0,0.2)' : '' }} title="Llamar" onClick={() => window.open(`tel:${apt.patients?.phone}`)}>
            <Phone size={16} color={isConfirmed ? 'black' : ''} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="agenda-wrapper h-full">
      <header className="agenda-main-header">
        <div className="flex items-center gap-4">
           <div className="logo-sparkle glass"><CalendarIcon size={24} color="var(--primary)" /></div>
           <h2 className="text-2xl font-bold tracking-wider">MI AGENDA <span className="text-gold">LUMINI</span></h2>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/new-appointment')}>+ Agendar Cita</button>
      </header>

      <div className="agenda-grid-container">
        {/* Left Side: Daily & Tomorrow List */}
        <div className="agenda-list-section custom-scrollbar">
          <section className="day-bucket">
            <div className="bucket-header">
              <span className="bucket-title">HOY</span>
              <span className="bucket-date">{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
            </div>
            {todayApts.length === 0 ? (
              <div className="empty-bucket glass">Cero agendas para hoy</div>
            ) : (
              todayApts.map(apt => renderAptCard(apt, true))
            )}
          </section>

          <section className="day-bucket mt-8">
            <div className="bucket-header">
              <span className="bucket-title op-50">MAÑANA</span>
              <span className="bucket-date op-50">
                {new Date(new Date(selectedDate).setDate(selectedDate.getDate() + 1)).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </span>
            </div>
            {tomorrowApts.length === 0 ? (
              <div className="empty-bucket glass op-50">Cero agendas para mañana</div>
            ) : (
              tomorrowApts.map(apt => renderAptCard(apt, false))
            )}
          </section>
        </div>

        {/* Right Side: Interactive Calendar */}
        <div className="agenda-calendar-section">
           {renderCalendar()}
           <div className="card glass mt-4 p-4 quote-card">
              <p className="italic text-muted font-light" style={{ fontSize: '0.85rem' }}>"La disciplina es el puente entre las metas y los logros."</p>
              <div className="mt-4 flex items-center gap-3">
                 <div className="stat-indicator"><div className="gold-dot inline"></div> {busyDays.size} días con actividad</div>
                 <div className="stat-indicator"><User size={14} /> Total: {todayApts.length + tomorrowApts.length} pacientes</div>
              </div>
           </div>
        </div>
      </div>

      <style>{`
        .agenda-wrapper {
          padding: 1.5rem;
          padding-bottom: 7rem;
        }
        .agenda-main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .agenda-grid-container {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 2rem;
          height: auto;
        }
        .bucket-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 1.2rem;
          border-bottom: 1px solid rgba(212,175,55,0.2);
          padding-bottom: 0.5rem;
        }
        .bucket-title {
          font-weight: 800;
          letter-spacing: 0.1em;
          color: white;
          font-size: 1.1rem;
        }
        .bucket-date {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: capitalize;
        }
        .apt-card {
          margin-bottom: 1rem;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: transform 0.2s;
        }
        .apt-card:hover {
          transform: translateX(5px);
          background: rgba(255,255,255,0.05);
        }
        .apt-time-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.4rem;
        }
        .apt-time {
          font-weight: 700;
          font-size: 0.9rem;
        }
        .apt-patient {
          margin: 0.2rem 0;
          font-size: 1rem;
        }
        .apt-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .apt-actions {
          display: flex;
          gap: 0.5rem;
        }
        .btn-icon {
          width: 36px;
          height: 36px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
        }
        .empty-bucket {
          padding: 2rem;
          text-align: center;
          color: var(--text-muted);
          font-style: italic;
          border-style: dashed;
          font-size: 0.85rem;
        }
        .is-confirmed {
          background: var(--primary) !important;
          border-left: none !important;
          color: black !important;
        }
        .is-confirmed .apt-patient,
        .is-confirmed .apt-time,
        .is-confirmed .apt-meta,
        .is-confirmed .apt-meta span {
          color: black !important;
          font-weight: 700;
        }
        .is-confirmed .apt-patient {
          font-weight: 850;
        }
        .is-confirmed .apt-meta {
          opacity: 0.8;
        }
        .is-confirmed svg {
           color: black !important;
        }
        .is-cancelled {
          opacity: 0.4;
          filter: grayscale(1);
          pointer-events: none;
        }
        .is-cancelled .apt-patient {
           text-decoration: line-through;
        }
        
        .confirm-bubble {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 100;
          padding: 1rem;
          background: #111 !important;
          border: 1px solid var(--primary);
          border-radius: 12px;
          min-width: 180px;
          box-shadow: 0 15px 50px rgba(0,0,0,0.8);
          animation: popIn 0.2s ease-out;
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .confirm-bubble p {
          font-size: 0.8rem;
          font-weight: 600;
        }
        .confirm-btn {
          flex: 1;
          padding: 0.4rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
        }
        .confirm-btn.si { background: var(--primary); color: black; }
        .confirm-btn.no { background: rgba(255,255,255,0.1); color: white; }
        
        .option-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 0.6rem;
          font-size: 0.8rem;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          border-radius: 6px;
        }
        .option-item:hover { background: rgba(255,255,255,0.05); }
        .option-item.close { border-top: 1px solid rgba(255,255,255,0.1); margin-top: 0.3rem; opacity: 0.6; }

        .btn-white {
          background: white;
          color: black;
          border: none;
        }
        
        /* Calendar Styling */
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 0 0.5rem;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
        }
        .calendar-weekday {
          text-align: center;
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          padding-bottom: 5px;
        }
        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 8px;
          position: relative;
          font-size: 0.9rem;
          transition: 0.2s;
        }
        .calendar-day:hover {
          background: rgba(212,175,55,0.1);
        }
        .calendar-day.selected {
          background: var(--primary) !important;
          color: black;
          font-weight: 700;
        }
        .gold-dot {
          width: 4px;
          height: 4px;
          background: var(--primary);
          border-radius: 50%;
          position: absolute;
          bottom: 6px;
          box-shadow: 0 0 5px var(--primary);
        }
        .calendar-day.selected .gold-dot {
          background: white;
        }
        
        .op-50 { opacity: 0.5; }
        .inline { display: inline-block; position: static; margin-right: 5px; }
        .stat-indicator { font-size: 0.75rem; display: flex; alignItems: center; gap: 4px; }

        @media (max-width: 900px) {
          .agenda-grid-container {
            grid-template-columns: 1fr;
          }
          .agenda-calendar-section {
            order: -1;
            margin-bottom: 2rem;
          }
        }
      `}</style>
    </div>
  );
};
