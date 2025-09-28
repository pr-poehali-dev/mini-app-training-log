import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  notes: string;
}

interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: Exercise[];
}

export default function Index() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState('calendar');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isWorkoutDialogOpen, setIsWorkoutDialogOpen] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

  const getWorkoutForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return workouts.find(w => w.date === dateKey);
  };

  const getPreviousWorkout = (currentDate: Date): Workout | null => {
    const sortedWorkouts = workouts
      .filter(w => new Date(w.date) < currentDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sortedWorkouts[0] || null;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    const workout = getWorkoutForDate(date);
    
    if (workout) {
      setCurrentWorkout(workout);
      setIsEditing(false);
    } else {
      const newWorkout: Workout = {
        id: Date.now().toString(),
        name: 'Новая тренировка',
        date: formatDateKey(date),
        exercises: []
      };
      setCurrentWorkout(newWorkout);
      setIsEditing(true);
    }
    
    setIsWorkoutDialogOpen(true);
  };

  const saveWorkout = () => {
    if (!currentWorkout) return;
    
    const updatedWorkouts = workouts.filter(w => w.id !== currentWorkout.id);
    setWorkouts([...updatedWorkouts, currentWorkout]);
    setIsWorkoutDialogOpen(false);
    setIsEditing(false);
  };

  const addExercise = () => {
    if (!currentWorkout) return;
    
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: '',
      sets: 0,
      reps: 0,
      weight: 0,
      notes: ''
    };
    
    setCurrentWorkout({
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, newExercise]
    });
  };

  const updateExercise = (exerciseId: string, field: keyof Exercise, value: string | number) => {
    if (!currentWorkout) return;
    
    setCurrentWorkout({
      ...currentWorkout,
      exercises: currentWorkout.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      )
    });
  };

  const copyPreviousWorkout = () => {
    if (!currentWorkout || !selectedDate) return;
    
    const previousWorkout = getPreviousWorkout(selectedDate);
    if (!previousWorkout) return;
    
    setCurrentWorkout({
      ...currentWorkout,
      name: previousWorkout.name,
      exercises: previousWorkout.exercises.map(ex => ({
        ...ex,
        id: Date.now().toString() + Math.random()
      }))
    });
  };

  const deleteExercise = (exerciseId: string) => {
    if (!currentWorkout) return;
    
    setCurrentWorkout({
      ...currentWorkout,
      exercises: currentWorkout.exercises.filter(ex => ex.id !== exerciseId)
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            Workout Tracker
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Icon name="Calendar" size={16} />
              Календарь
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Icon name="User" size={16} />
              Профиль
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Icon name="Settings" size={16} />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Выберите дату</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={ru}
                  className="rounded-md border"
                  modifiers={{
                    hasWorkout: (date) => !!getWorkoutForDate(date)
                  }}
                  modifiersStyles={{
                    hasWorkout: {
                      backgroundColor: '#2563eb',
                      color: 'white',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Recent Workouts */}
            {workouts.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Последние тренировки</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {workouts
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 3)
                    .map(workout => (
                      <div 
                        key={workout.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setCurrentWorkout(workout);
                          setIsEditing(false);
                          setIsWorkoutDialogOpen(true);
                        }}
                      >
                        <div>
                          <div className="font-medium">{workout.name}</div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(workout.date), 'd MMMM yyyy', { locale: ru })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Icon name="Activity" size={14} />
                          {workout.exercises.length} упр.
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Профиль</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <Icon name="User" size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Статистика и настройки профиля скоро появятся</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Настройки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <Icon name="Settings" size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Настройки приложения скоро появятся</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Workout Dialog */}
      <Dialog open={isWorkoutDialogOpen} onOpenChange={setIsWorkoutDialogOpen}>
        <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: ru }) : 'Тренировка'}
              </span>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Icon name="Edit" size={16} />
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {currentWorkout && (
            <div className="space-y-4">
              {/* Workout Name */}
              <div>
                <Label htmlFor="workout-name">Название тренировки</Label>
                <Input
                  id="workout-name"
                  value={currentWorkout.name}
                  onChange={(e) => setCurrentWorkout({
                    ...currentWorkout,
                    name: e.target.value
                  })}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>

              {/* Copy Previous Workout Button */}
              {isEditing && getPreviousWorkout(selectedDate!) && (
                <Button
                  variant="outline"
                  onClick={copyPreviousWorkout}
                  className="w-full"
                >
                  <Icon name="Copy" size={16} className="mr-2" />
                  Скопировать предыдущую тренировку
                </Button>
              )}

              {/* Exercises */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Упражнения</Label>
                  {isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addExercise}
                    >
                      <Icon name="Plus" size={16} className="mr-1" />
                      Добавить
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {currentWorkout.exercises.map((exercise, index) => (
                    <Card key={exercise.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Упражнение {index + 1}</Label>
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteExercise(exercise.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          )}
                        </div>
                        
                        <Input
                          placeholder="Название упражнения"
                          value={exercise.name}
                          onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                          disabled={!isEditing}
                        />
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-sm">Подходы</Label>
                            <Input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                              disabled={!isEditing}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Повторения</Label>
                            <Input
                              type="number"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                              disabled={!isEditing}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Вес (кг)</Label>
                            <Input
                              type="number"
                              value={exercise.weight}
                              onChange={(e) => updateExercise(exercise.id, 'weight', parseFloat(e.target.value) || 0)}
                              disabled={!isEditing}
                              className="mt-1"
                              step="0.5"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm">Примечания</Label>
                          <Textarea
                            placeholder="Дополнительные заметки..."
                            value={exercise.notes}
                            onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
                            disabled={!isEditing}
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={saveWorkout} className="flex-1">
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      if (!workouts.find(w => w.id === currentWorkout.id)) {
                        setIsWorkoutDialogOpen(false);
                      }
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}