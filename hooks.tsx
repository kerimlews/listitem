import React, { useMemo } from 'react';
import type { SelectedLibrary } from '../../Filters/slice';
import { Collection } from '../../TreePanel/types';
import { shouldDisplayReferenceProfilePicture } from '../helpers';
import type { Reference } from '../types';
import ReferenceOwnerProfile from './ReferenceOwnerProfile';

const CollectionList = React.lazy(
  () => import(/* webpackChunkName: "app-reference-collection-list" */ './ReferenceCollectionList')
);

export const useCollectionListComponent = (
  referenceId: string,
  collections: string[] | undefined,
  index: number,
  type: 'folder' | 'label',
  activeLibraryOrFolder: SelectedLibrary | undefined,
  onCollectionChange: () => void,
  onCollectionRemove: (collection: Collection, libraryId: string) => void
) => {
  const CollectionListComponent = useMemo(() => {
    if (
      (type === 'label' && (!collections || !collections.length)) ||
      (type === 'folder' && (!collections || !collections.length) && !activeLibraryOrFolder)
    ) {
      return null;
    }

    return (
      <React.Suspense fallback={<></>}>
        <CollectionList
          referenceId={referenceId}
          type={type}
          onChange={onCollectionChange}
          collectionsId={collections || []}
          onClear={onCollectionRemove}
          activeLibrary={activeLibraryOrFolder}
        />
      </React.Suspense>
    );
  }, [referenceId, index, collections, activeLibraryOrFolder]);

  return CollectionListComponent;
};

export const useProfileComponent = (
  reference: Reference,
  isTrashed: boolean,
  activeLibraryOrFolder: SelectedLibrary | undefined
) => {
  const ProfileComponent = useMemo(() => {
    if (!shouldDisplayReferenceProfilePicture(isTrashed, activeLibraryOrFolder, reference.linked_from)) return null;
    const owner = reference.linked_from ? reference.linked_from.split(':')[0] : reference.owner;
    return (
      <ReferenceOwnerProfile
        showOnlyName={isTrashed}
        ownerId={owner}
        time={isTrashed ? undefined : reference.created}
      />
    );
  }, [activeLibraryOrFolder, reference.linked_from, isTrashed]);

  return ProfileComponent;
};
