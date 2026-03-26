import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = "max-w-lg" 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className={`relative w-full ${maxWidth} overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl`}
          >
            <button 
              onClick={onClose}
              className="absolute right-6 top-6 rounded-full bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            {title && <h2 className="mb-6 text-2xl font-bold text-white">{title}</h2>}
            
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
