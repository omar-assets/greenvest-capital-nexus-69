
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus } from 'lucide-react';

interface DealNotesProps {
  dealId: string;
}

const DealNotes = ({ dealId }: DealNotesProps) => {
  const [newNote, setNewNote] = useState('');
  const [notes] = useState<any[]>([]); // Placeholder for notes data

  const handleAddNote = () => {
    if (newNote.trim()) {
      // TODO: Implement note creation logic
      console.log('Adding note:', newNote);
      setNewNote('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your note here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button onClick={handleAddNote} disabled={!newNote.trim()}>
            Add Note
          </Button>
        </CardContent>
      </Card>

      {/* Notes List */}
      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">No notes yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Add a note to keep track of important information about this deal.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <p className="text-sm text-slate-700">{note.content}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span>{note.author}</span>
                  <span>{note.createdAt}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DealNotes;
