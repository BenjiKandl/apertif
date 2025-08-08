import React, { useState, useEffect } from 'react';
const dietOptions = ['Vegetarian', 'Vegan', 'Halal', 'No nuts', 'No gluten'];
const bottleOptions = ['Red wine', 'White wine', 'Rosé', 'Bubbles', 'Non-alcoholic'];

function getWineSuggestion(spiceLevel, protein) {
  if (!protein) return '';
  const suggestions = {
    Chicken: ['Chardonnay', 'Sauvignon Blanc', 'Riesling', 'Pinot Noir'],
    Beef: ['Cabernet sauvignon', 'Merlot', 'syrah', 'Malbec'],
    Fish: ['Sauvignon Blanc', 'Pinot Gris', 'Champagne', 'Ros\u00e9'],
    Vegetable: ['Pinot Grigio', 'Chenin Blanc', 'Ros\u00e9', 'Sparkling'],
    Pork: ['Pinot Noir', 'Grenache', 'Ros\u00e9', 'Cava'],
    Lamb: ['Syrah', 'Malbec', 'Cabernet Franc', 'Pinot Noir']
  };
  const wines = suggestions[protein] || [];
  return wines[spiceLevel] || '';
}


function formatDateForICS(dateString) {
  const dt = new Date(dateString);
  return dt.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function downloadIcs(title, description, startDateTime, location) {
  const dtStart = startDateTime;
  const dtEnd = dtStart;
  const content =
    'BEGIN:VCALENDAR\n' +
    'VERSION:2.0\n' +
    'BEGIN:VEVENT\n' +
    'SUMMARY:' + title + '\n' +
    'DESCRIPTION:' + description + '\n' +
    'DTSTART:' + formatDateForICS(dtStart) + '\n' +
    'DTEND:' + formatDateForICS(dtEnd) + '\n' +
    'LOCATION:' + location + '\n' +
    'END:VEVENT\n' +
    'END:VCALENDAR';
  const blob = new Blob([content], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = title + '.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getSunSeekerDescriptor(date) {
  const hour = new Date(date).getHours();
  if (hour >= 6 && hour < 12) return 'Bright day';
  if (hour >= 12 && hour < 16) return 'Golden hour';
  if (hour >= 16 && hour < 20) return 'Dusk';
  return 'After sunset';
}

function getTubeTips(station) {
  if (!station) return '';
  return 'Nearest station: ' + station;
}

function RsvpPage({ event, addGuest }) {
  const [name, setName] = useState('');
  const [diets, setDiets] = useState([]);
  const [bottle, setBottle] = useState(bottleOptions[0]);

  const toggleDiet = (diet) => {
    setDiets(diets.includes(diet) ? diets.filter((d) => d !== diet) : [...diets, diet]);
  };

  const handleSubmit = () => {
    addGuest({ name, diets, bottle });
    alert('RSVP submitted! Thank you.');
    setName('');
    setDiets([]);
    setBottle(bottleOptions[0]);
  };

  return (
    <div className='p-4 max-w-lg mx-auto'>
      <h2 className='text-xl font-bold mb-2'>RSVP for {event.title}</h2>
      <p className='mb-2'>Date: {event.date} {event.time}</p>
      <p className='mb-2'>Location: {event.station}</p>
      <p className='mb-2'>Cuisine: {event.cuisine} - {event.protein}</p>
      <p className='mb-2'>Spice level: {event.spiceLevel === 0 ? 'Mild' : '🌶️'.repeat(event.spiceLevel)}</p>
      <p className='mb-2'>{getTubeTips(event.station)}</p>
      <p className='mb-4'>Transport tip: Use Citymapper or Google Maps for directions.</p>

      <label className='block mb-2'>
        Name (optional)
        <input className='border p-1 w-full' value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <div className='mb-2'>
        Dietary restrictions:
        <div className='flex flex-wrap mt-1'>
          {dietOptions.map((opt) => (
            <button key={opt} type='button'
              className={'m-1 px-2 py-1 border rounded ' + (diets.includes(opt) ? 'bg-blue-500 text-white' : 'bg-gray-200')}
              onClick={() => toggleDiet(opt)}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className='mb-2'>
        Bottle you\u2019ll bring:
        <div className='flex flex-wrap mt-1'>
          {bottleOptions.map((opt) => (
            <button key={opt} type='button'
              className={'m-1 px-2 py-1 border rounded ' + (bottle === opt ? 'bg-green-500 text-white' : 'bg-gray-200')}
              onClick={() => setBottle(opt)}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <button className='bg-blue-600 text-white px-4 py-2 rounded' onClick={handleSubmit}>Submit RSVP</button>
    </div>
  );
}

function App() {
  const [event, setEvent] = useState({
    title: '',
    date: '',
    time: '',
    station: '',
    cuisine: '',
    protein: '',
    spiceLevel: 0,
    capacity: 0,
    arrivalSlotsEnabled: false,
    isAnonymous: false
  });
  const [guests, setGuests] = useState([]);
  const [showRsvp, setShowRsvp] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('rsvp') === '1') {
      const storedEvent = JSON.parse(localStorage.getItem('event') || '{}');
      setEvent(storedEvent);
      setShowRsvp(true);
    }
  }, []);

  const handleEventChange = (field, value) => {
    setEvent((prev) => ({ ...prev, [field]: value }));
  };

  const getAssignedSlot = (index) => {
    const eventDateTime = new Date(event.date + 'T' + event.time);
    const slotStart = new Date(eventDateTime.getTime() + index * 10 * 60000);
    return slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const addGuest = (guest) => {
    setGuests((prev) => {
      const slot = event.arrivalSlotsEnabled ? getAssignedSlot(prev.length) : null;
      return [...prev, { ...guest, slot }];
    });
  };

  useEffect(() => {
    if (!showRsvp && event.title) {
      localStorage.setItem('event', JSON.stringify({ ...event, guests }));
    }
  }, [event, guests, showRsvp]);

  if (showRsvp) {
    return <RsvpPage event={event} addGuest={addGuest} />;
  }

  const wineSuggestion = getWineSuggestion(event.spiceLevel, event.protein);

  return (
    <div className='p-4 max-w-2xl mx-auto'>
      <h1 className='text-2xl font-bold mb-4'>Plan your dinner party</h1>

      <label className='block mb-2'>
        Party name
        <input className='border p-1 w-full' value={event.title} onChange={(e) => handleEventChange('title', e.target.value)} />
      </label>

      <label className='block mb-2'>
        Date
        <input type='date' className='border p-1 w-full' value={event.date} onChange={(e) => handleEventChange('date', e.target.value)} />
      </label>

      <label className='block mb-2'>
        Time
        <input type='time' className='border p-1 w-full' value={event.time} onChange={(e) => handleEventChange('time', e.target.value)} />
      </label>

      <label className='block mb-2'>
        Nearest tube station
        <input className='border p-1 w-full' value={event.station} onChange={(e) => handleEventChange('station', e.target.value)} />
      </label>

      <label className='block mb-2'>
        Cuisine
        <input className='border p-1 w-full' value={event.cuisine} onChange={(e) => handleEventChange('cuisine', e.target.value)} />
      </label>

      <label className='block mb-2'>
        Protein
        <select className='border p-1 w-full' value={event.protein} onChange={(e) => handleEventChange('protein', e.target.value)}>
          <option value=''>Select protein</option>
          <option value='Chicken'>Chicken</option>
          <option value='Beef'>Beef</option>
          <option value='Fish'>Fish</option>
          <option value='Vegetable'>Vegetable</option>
          <option value='Pork'>Pork</option>
          <option value='Lamb'>Lamb</option>
        </select>
      </label>

      <div className='mb-2'>
        Spice level
        <div className='flex space-x-2 mt-1'>
          {[0,1,2,3].map((level) => (
            <button key={level} type='button'
              className={'px-2 py-1 border rounded ' + (event.spiceLevel === level ? 'bg-red-500 text-white' : 'bg-gray-200')}
              onClick={() => handleEventChange('spiceLevel', level)}>
              {level === 0 ? 'Mild' : '🌶️'.repeat(level)}
            </button>
          ))}
        </div>
      </div>

      <label className='block mb-2'>
        Capacity
        <input type='number' className='border p-1 w-full' value={event.capacity} onChange={(e) => handleEventChange('capacity', e.target.value)} />
      </label>

      <label className='flex items-center mb-2'>
        <input type='checkbox' className='mr-2' checked={event.arrivalSlotsEnabled} onChange={(e) => handleEventChange('arrivalSlotsEnabled', e.target.checked)} />
        Use arrival slots (10 min)
      </label>

      <label className='flex items-center mb-4'>
        <input type='checkbox' className='mr-2' checked={event.isAnonymous} onChange={(e) => handleEventChange('isAnonymous', e.target.checked)} />
        Guests anonymous
      </label>

      <div className='mb-4'>
        <p className='mb-2 font-medium'>Wine suggestion: <span className='font-normal'>{wineSuggestion}</span></p>
        {event.date && event.time && event.station && (
          <p className='mb-2'>Sun: {getSunSeekerDescriptor(event.date + 'T' + event.time)}</p>
        )}
        {event.station && <p className='mb-2'>{getTubeTips(event.station)}</p>}
      </div>

      <button className='bg-blue-600 text-white px-4 py-2 rounded mr-2'
        onClick={() => {
          if (!event.title) {
            alert('Please enter an event title first.');
            return;
          }
          const startDateTime = event.date + 'T' + event.time;
          downloadIcs(event.title, 'Dinner party at ' + event.station, startDateTime, event.station);
        }}>
        Add to calendar
      </button>

      <button className='bg-green-600 text-white px-4 py-2 rounded'
        onClick={() => {
          if (!event.title) {
            alert('Please enter event details first.');
            return;
          }
          const saveEvent = { ...event, guests };
          localStorage.setItem('event', JSON.stringify(saveEvent));
          const url = window.location.href.split('?')[0] + '?rsvp=1';
          navigator.clipboard.writeText(url);
          alert('RSVP link copied!');
        }}>
        Copy RSVP link
      </button>

      {guests.length > 0 && (
        <div className='mt-6'>
          <h2 className='text-xl font-bold mb-2'>Guest list</h2>
          <p>Total guests: {guests.length}{event.capacity ? ' / ' + event.capacity : ''}</p>
          <ul className='mb-2'>
            {guests.map((g, i) => (
              <li key={i} className='border-b py-1'>
                <span>{event.isAnonymous ? 'Guest #' + (i + 1) : (g.name || 'Guest #' + (i + 1))}</span>
                {g.diets.length > 0 && <span className='ml-2 text-sm'>({g.diets.join(', ')})</span>}
                {event.arrivalSlotsEnabled && <span className='ml-2 text-sm'>Arrival: {g.slot}</span>}
              </li>
            ))}
          </ul>
          <p className='mb-2'>Dietary counts: {dietOptions.map((opt) => {
            const count = guests.filter((g) => g.diets.includes(opt)).length;
            return count > 0 ? opt + ' (' + count + ')' : null;
          }).filter(Boolean).join(', ') || 'None'}</p>
          <p className='mb-2'>Bottle counts: {bottleOptions.map((opt) => {
            const count = guests.filter((g) => g.bottle === opt).length;
            return count > 0 ? opt + ' (' + count + ')' : null;
          }).filter(Boolean).join(', ') || 'None'}</p>
        </div>
      )}

    </div>
  );
}

export default App;
