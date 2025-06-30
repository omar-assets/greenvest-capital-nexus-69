
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X } from 'lucide-react';

interface EditableFieldProps {
  label: string;
  value: string | number;
  onSave: (value: string | number) => void;
  type?: 'text' | 'email' | 'tel' | 'number' | 'integer' | 'textarea';
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

const EditableField = ({ 
  label, 
  value, 
  onSave, 
  type = 'text', 
  placeholder,
  min,
  max,
  step
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleSave = () => {
    let finalValue: string | number = editValue;
    
    if (type === 'number' || type === 'integer') {
      finalValue = type === 'integer' ? parseInt(editValue) : parseFloat(editValue);
      if (isNaN(finalValue)) {
        finalValue = 0;
      }
    }
    
    onSave(finalValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const formatDisplayValue = (val: string | number) => {
    if (type === 'number' && typeof val === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    
    if (type === 'integer' && typeof val === 'number') {
      return val.toString();
    }
    
    return val || 'Not provided';
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <div className="flex items-center space-x-2">
          {type === 'textarea' ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className="bg-slate-700 border-slate-600 text-slate-200"
              rows={3}
            />
          ) : (
            <Input
              type={type === 'integer' ? 'number' : type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              min={min}
              max={max}
              step={step}
              className="bg-slate-700 border-slate-600 text-slate-200"
            />
          )}
          <Button size="sm" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <div className="flex items-center justify-between group">
        <span className="text-slate-200">
          {formatDisplayValue(value)}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default EditableField;
