import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTaskContext } from './TaskContext';
import { DataHydrationService } from '../common/utils/DataHydrationService';

// Create the tag context
const TagContext = createContext();

const normalizeTag = (tag) => (typeof tag === 'string' ? tag.trim() : '');

// Custom hook for using tag context
export const useTagContext = () => useContext(TagContext);

// Tag provider component
export const TagProvider = ({ children }) => {
  const [customTags, setCustomTags] = useState(() => {
    const hydratedTags = DataHydrationService.shouldHydrate()
      ? DataHydrationService.getInitialTags()
      : [];

    return hydratedTags.map(normalizeTag).filter(Boolean);
  });
  const [tags, setTags] = useState(() => {
    const hydratedTags = DataHydrationService.shouldHydrate()
      ? DataHydrationService.getInitialTags()
      : [];

    return hydratedTags.map(normalizeTag).filter(Boolean);
  });
  const { tasks } = useTaskContext();

  useEffect(() => {
    const taskTags = tasks.flatMap(task => {
      if (!Array.isArray(task.tags)) return [];
      return task.tags.map(normalizeTag).filter(Boolean);
    });

    setTags(Array.from(new Set([...customTags, ...taskTags])));
  }, [customTags, tasks]);

  const addTag = (tag) => {
    const normalizedTag = normalizeTag(tag);
    if (!normalizedTag) return;

    const alreadyExists = [...customTags, ...tags].some(existingTag =>
      existingTag.toLowerCase() === normalizedTag.toLowerCase()
    );

    if (alreadyExists) return;

    setCustomTags(prevTags => Array.from(new Set([...prevTags, normalizedTag])));
  };

  const editTag = (oldTag, newTag) => {
    const normalizedOldTag = normalizeTag(oldTag);
    const normalizedNewTag = normalizeTag(newTag);

    if (!normalizedOldTag || !normalizedNewTag || normalizedOldTag.toLowerCase() === normalizedNewTag.toLowerCase()) {
      return;
    }

    const duplicateExists = [...customTags, ...tags].some(existingTag =>
      existingTag !== normalizedOldTag && existingTag.toLowerCase() === normalizedNewTag.toLowerCase()
    );

    if (duplicateExists) return;

    setCustomTags(prevTags => prevTags.map(tag =>
      tag.toLowerCase() === normalizedOldTag.toLowerCase() ? normalizedNewTag : tag
    ));
  };

  const deleteTag = (tagToDelete) => {
    const normalizedTagToDelete = normalizeTag(tagToDelete);
    if (!normalizedTagToDelete) return;

    setCustomTags(prevTags => prevTags.filter(tag =>
      tag.toLowerCase() !== normalizedTagToDelete.toLowerCase()
    ));
  };

  const handleManageTags = (operation, oldTag, newTag = null) => {
    switch (operation) {
      case 'add':
        addTag(oldTag);
        break;
         
      case 'edit':
        editTag(oldTag, newTag);
        break;
         
      case 'delete':
        deleteTag(oldTag);
        break;
         
      default:
        break;
    }
  };

  return (
    <TagContext.Provider
      value={{
        tags,
        addTag,
        editTag,
        deleteTag,
        handleManageTags
      }}
    >
      {children}
    </TagContext.Provider>
  );
};