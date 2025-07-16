'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);

export default function SchedulePostsPage() {
  const [scheduleType, setScheduleType] = useState<'single' | 'week' | 'month'>('single');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // image URLs
  const [previews, setPreviews] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // index 0-6 for week
  const [weekImageMap, setWeekImageMap] = useState<{ [dayIdx: number]: string }>({});
  const [selectedMonthDay, setSelectedMonthDay] = useState<string | null>(null); // date string 'YYYY-MM-DD'
  const [monthImageMap, setMonthImageMap] = useState<{ [date: string]: string }>({});

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      // Fetch media for this user
      if (user) {
        const { data: mediaData } = await supabase
          .from('media')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setMedia(mediaData || []);
      }
    };
    fetchUser();
  }, []);

  // Toggle image selection
  const handleImageSelect = (url: string) => {
    if (scheduleType === 'single') {
      setSelectedImages([url]);
    } else if (scheduleType === 'week') {
      if (selectedDay !== null) {
        setWeekImageMap({ ...weekImageMap, [selectedDay]: url });
      }
    } else if (scheduleType === 'month') {
      if (selectedMonthDay) {
        setMonthImageMap({ ...monthImageMap, [selectedMonthDay]: url });
      }
    } else {
      if (selectedImages.includes(url)) {
        setSelectedImages(selectedImages.filter(u => u !== url));
      } else if (selectedImages.length < getMaxImages()) {
        setSelectedImages([...selectedImages, url]);
      }
    }
  };

  const getMaxImages = () => {
    if (scheduleType === 'single') return 1;
    if (scheduleType === 'week') return selectedDays.length || 7;
    if (scheduleType === 'month') return selectedDays.length || 30;
    return 1;
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // For week, build selectedImages from weekImageMap (only non-empty)
  useEffect(() => {
    if (scheduleType === 'week') {
      setSelectedImages(Object.values(weekImageMap).filter(Boolean));
    }
  }, [weekImageMap, scheduleType]);

  // For month, build selectedImages from monthImageMap (only non-empty)
  useEffect(() => {
    if (scheduleType === 'month') {
      setSelectedImages(Object.values(monthImageMap).filter(Boolean));
    }
  }, [monthImageMap, scheduleType]);

  // Helper to get all days in the current month as a grid (weeks)
  const getMonthGrid = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
    const grid: Array<{ day: string; date: string } | null> = [];
    // Fill empty cells before the first day
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push(null);
    }
    // Fill days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      grid.push({ day: dayName, date: dateObj.toISOString().slice(0, 10) });
    }
    // Optionally fill trailing empty cells to complete the last week
    while (grid.length % 7 !== 0) {
      grid.push(null);
    }
    return grid;
  };
  const monthGrid = getMonthGrid();

  // Helper to get scheduled days count
  const scheduledDaysCount = scheduleType === 'week'
    ? Object.values(weekImageMap).filter(Boolean).length
    : scheduleType === 'month'
      ? Object.values(monthImageMap).filter(Boolean).length
      : selectedImages.length;
  const totalDays = scheduleType === 'week' ? 7 : scheduleType === 'month' ? monthGrid.filter(Boolean).length : getMaxImages();

  // When generating previews, only include days with images and pass mapping for scheduled dates
  const handleGeneratePreviews = async () => {
    setLoading(true);
    setError(null);
    try {
      let images = selectedImages;
      let selected_days: any[] = selectedDays;
      let imageDateMap: { [key: string]: string } = {};
      if (scheduleType === 'week') {
        images = [];
        selected_days = [];
        Object.entries(weekImageMap).forEach(([idx, url]) => {
          if (url && !isNaN(Number(idx))) {
            images.push(url);
            selected_days.push(Number(idx)); // ensure number type
            imageDateMap[url] = weekInfo[Number(idx)].date;
          }
        });
      } else if (scheduleType === 'month') {
        images = [];
        selected_days = [];
        Object.entries(monthImageMap).forEach(([date, url]) => {
          if (url) {
            images.push(url);
            selected_days.push(date); // string for month
            imageDateMap[url] = date;
          }
        });
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['Authorization'] = `Bearer ${userId}`;
      }
      const res = await fetch('/api/schedule-posts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          images,
          schedule_type: scheduleType,
          selected_days,
          imageDateMap,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate previews');
      }
      const data = await res.json();
      setPreviews(data.previews.map((p: any, i: number) => ({
        ...p,
        media_url: p.media_url || p.image || images[i],
      })));
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSchedule = async () => {
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      // Attach user_id to each post
      const postsWithUser = previews.map(post => ({
        ...post,
        user_id: userId,
        media_url: post.media_url,
        platform: post.platform || 'instagram',
      }));
      // Get the user's Supabase access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      const res = await fetch('/api/save-scheduled-posts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ posts: postsWithUser }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save scheduled posts');
      }
      // Redirect to dashboard on success
      router.push('/dashboard?message=' + encodeURIComponent('Posts scheduled successfully!'));
    } catch (err: any) {
      setConfirmError(err.message || 'Unknown error');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Helper to get the date string and day name for each day in the upcoming week
  const getUpcomingWeekInfo = () => {
    const today = new Date();
    const weekInfo: { day: string; date: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      weekInfo.push({ day: dayName, date: d.toISOString().slice(0, 10) });
    }
    return weekInfo;
  };
  const weekInfo = getUpcomingWeekInfo();

  // Helper to get all days in the current month
  const getMonthDaysInfo = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: { day: string; date: string }[] = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateObj = new Date(year, month, d);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({ day: dayName, date: dateObj.toISOString().slice(0, 10) });
    }
    return days;
  };
  const monthDaysInfo = getMonthDaysInfo();

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Schedule Posts</h1>
      {step === 1 && (
        <div>
          <div className="mb-4">
            <label className="font-semibold">Schedule Type:</label>
            <select
              value={scheduleType}
              onChange={e => {
                setScheduleType(e.target.value as any);
                setSelectedDays([]);
                setSelectedImages([]);
                setSelectedDay(null);
                setWeekImageMap({});
                setSelectedMonthDay(null);
                setMonthImageMap({});
              }}
              className="ml-2 border rounded px-2 py-1"
            >
              <option value="single">Single Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          {scheduleType === 'week' && (
            <div className="mb-4">
              <label className="font-semibold">Select Days & Assign Images:</label>
              <div className="flex gap-4 mt-2">
                {weekInfo.map((info, idx) => (
                  <button
                    key={info.date}
                    className={`flex flex-col items-center focus:outline-none ${selectedDay === idx ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    onClick={() => setSelectedDay(idx)}
                    type="button"
                  >
                    <span className="text-xs text-gray-700 mb-1">{info.day}</span>
                    <div className={`w-24 h-24 rounded-lg border-2 flex items-center justify-center bg-gray-100 overflow-hidden mb-1 ${selectedDay === idx ? 'border-blue-500' : 'border-gray-200'}`}>
                      {weekImageMap[idx] ? (
                        <img src={weekImageMap[idx]} alt="Selected" className="object-cover w-full h-full rounded-lg" />
                      ) : (
                        <span className="text-gray-400 text-xs">No Image</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 mt-1">{info.date}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-500">Click a day, then select an image below to assign it.</div>
            </div>
          )}
          {scheduleType === 'month' && (
            <div className="mb-4">
              <label className="font-semibold">Select Days & Assign Images (Month):</label>
              <div className="grid grid-cols-7 gap-2 mt-2">
                {monthGrid.map((info, idx) => (
                  info ? (
                    <button
                      key={info.date}
                      className={`flex flex-col items-center focus:outline-none ${selectedMonthDay === info.date ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                      onClick={() => setSelectedMonthDay(info.date)}
                      type="button"
                    >
                      <span className="text-xs text-gray-700 mb-1">{info.day}</span>
                      <div className={`w-24 h-24 rounded-lg border-2 flex items-center justify-center bg-gray-100 overflow-hidden mb-1 ${selectedMonthDay === info.date ? 'border-blue-500' : 'border-gray-200'}`}>
                        {monthImageMap[info.date] ? (
                          <img src={monthImageMap[info.date]} alt="Selected" className="object-cover w-full h-full rounded-lg" />
                        ) : (
                          <span className="text-gray-400 text-xs">No Image</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">{info.date}</span>
                    </button>
                  ) : (
                    <div key={idx} className="w-24 h-24" />
                  )
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-500">Click a day, then select an image below to assign it.</div>
            </div>
          )}
          <div className="mb-4">
            <label className="font-semibold">Select Images{scheduleType === 'week' || scheduleType === 'month' ? ' (assign to days)' : ` (max ${getMaxImages()})`}:</label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {media.length === 0 && <div className="text-gray-500">No images found in your media library.</div>}
              {media.map((item, i) => (
                <button
                  key={item.id}
                  className={`w-24 h-24 border-2 border-gray-200 rounded overflow-hidden flex items-center justify-center p-0 bg-gray-100 ${
                    scheduleType === 'week'
                      ? Object.values(weekImageMap).includes(item.file_path)
                        ? 'ring-2 ring-blue-500'
                        : ''
                      : scheduleType === 'month'
                        ? Object.values(monthImageMap).includes(item.file_path)
                          ? 'ring-2 ring-blue-500'
                          : ''
                        : selectedImages.includes(item.file_path)
                          ? 'ring-2 ring-blue-500'
                          : ''
                  }`}
                  onClick={() => handleImageSelect(item.file_path)}
                  disabled={
                    scheduleType === 'week'
                      ? selectedDay === null
                      : scheduleType === 'month'
                        ? selectedMonthDay === null
                        : scheduleType !== 'single' && selectedImages.length >= getMaxImages() && !selectedImages.includes(item.file_path)
                  }
                  type="button"
                >
                  <img src={item.file_path} alt={item.file_name} className="object-cover w-full h-full" style={{ minWidth: 0, minHeight: 0 }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                </button>
              ))}
            </div>
            {scheduleType === 'week' && <div className="mt-2 text-sm text-gray-500">Selected day: {selectedDay !== null ? weekInfo[selectedDay]?.day : 'None'}</div>}
            {scheduleType === 'month' && <div className="mt-2 text-sm text-gray-500">Selected day: {selectedMonthDay || 'None'}</div>}
            {scheduleType !== 'week' && scheduleType !== 'month' && <div className="mt-2 text-sm text-gray-500">Selected: {selectedImages.length}</div>}
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={scheduledDaysCount === 0 || loading}
            onClick={handleGeneratePreviews}
          >
            {loading ? 'Generating...' : 'Generate Previews'}
          </button>
        </div>
      )}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Preview Scheduled Posts</h2>
          <div className="space-y-8">
            {previews.map((post, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-8 items-start border rounded-lg p-4 bg-white shadow-sm">
                {/* Instagram-style post preview */}
                <div className="w-full max-w-xs mx-auto md:mx-0">
                  <div className="bg-black rounded-t-lg overflow-hidden aspect-square w-full flex items-center justify-center">
                    <img src={post.media_url} alt="Preview" className="object-cover w-full h-full" style={{ aspectRatio: '1/1' }} />
                  </div>
                  <div className="bg-white rounded-b-lg border-t px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center text-white font-bold text-lg">IG</span>
                      <span className="font-semibold text-gray-900">YourBrand</span>
                      <span className="text-xs text-gray-400 ml-auto">Scheduled: {new Date(post.scheduledDate).toLocaleString()}</span>
                    </div>
                    <div className="text-gray-900 whitespace-pre-line" style={{ wordBreak: 'break-word' }}>{post.caption}</div>
                  </div>
                </div>
                {/* Editable caption sidebar */}
                <div className="flex-1 w-full md:w-1/2">
                  <label className="block font-semibold mb-1">Edit Caption</label>
                  <textarea
                    className="border px-3 py-2 rounded w-full min-h-[120px] resize-vertical"
                    value={post.caption}
                    onChange={e => {
                      const newPreviews = [...previews];
                      newPreviews[i].caption = e.target.value;
                      setPreviews(newPreviews);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {confirmError && <div className="text-red-600 mt-2">{confirmError}</div>}
          <button className="mt-6 bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50" onClick={handleConfirmSchedule} disabled={confirmLoading}>
            {confirmLoading ? 'Scheduling...' : 'Confirm Schedule'}
          </button>
        </div>
      )}
      {scheduleType === 'week' && <div className="mt-2 text-sm text-gray-500">Scheduled: {scheduledDaysCount} / 7 days</div>}
      {scheduleType === 'month' && <div className="mt-2 text-sm text-gray-500">Scheduled: {scheduledDaysCount} / {totalDays} days</div>}
    </div>
  );
} 