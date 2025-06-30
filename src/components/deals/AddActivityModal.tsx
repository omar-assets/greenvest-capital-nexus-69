
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MessageSquare, Phone, Mail } from 'lucide-react';

interface AddActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (activity: {
    category: 'note' | 'call' | 'email';
    title: string;
    description: string;
    mentionedUsers?: string[];
  }) => void;
  isLoading?: boolean;
}

const AddActivityModal = ({ open, onOpenChange, onSave, isLoading }: AddActivityModalProps) => {
  const [category, setCategory] = useState<'note' | 'call' | 'email'>('note');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!title.trim() || !description.trim()) return;

    // Parse @mentions from description (simple implementation)
    const mentionedUsers: string[] = [];
    const mentionRegex = /@(\w+)/g;
    let match;
    while ((match = mentionRegex.exec(description)) !== null) {
      mentionedUsers.push(match[1]);
    }

    onSave({
      category,
      title: title.trim(),
      description: description.trim(),
      mentionedUsers,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setCategory('note');
    onOpenChange(false);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'note': return <MessageSquare className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPlaceholderText = () => {
    switch (category) {
      case 'note':
        return 'Add your note here. Use @username to mention team members...';
      case 'call':
        return 'Call summary, duration, outcome, next steps...';
      case 'email':
        return 'Email summary, recipients, key points discussed...';
      default:
        return 'Enter description...';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-200">Add Activity</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Activity Type</Label>
            <Select value={category} onValueChange={(value: 'note' | 'call' | 'email') => setCategory(value)}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="note" className="text-slate-200">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon('note')}
                    <span>Note</span>
                  </div>
                </SelectItem>
                <SelectItem value="call" className="text-slate-200">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon('call')}
                    <span>Call</span>
                  </div>
                </SelectItem>
                <SelectItem value="email" className="text-slate-200">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon('email')}
                    <span>Email</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${category.charAt(0).toUpperCase() + category.slice(1)} title...`}
              className="bg-slate-700 border-slate-600 text-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={getPlaceholderText()}
              className="bg-slate-700 border-slate-600 text-slate-200 min-h-[120px]"
              rows={5}
            />
            <p className="text-xs text-slate-500">
              Tip: Use @username to mention team members
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !description.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Adding...' : 'Add Activity'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddActivityModal;
