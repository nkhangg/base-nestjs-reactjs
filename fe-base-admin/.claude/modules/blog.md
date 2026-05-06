# Module: modules/blog

## Mục đích
Quản lý blog posts và categories. Editor full-screen dùng `@uiw/react-md-editor` (Markdown). Hỗ trợ publish/unpublish.

## Cấu trúc
```
modules/blog/
├── components/
│   ├── BlogPage.tsx              # List posts + categories, CRUD
│   ├── BlogPostEditorPage.tsx    # Full-screen markdown editor (create + edit)
│   ├── BlogPostModal.tsx         # Quick create/edit modal (title, category, status)
│   ├── BlogCategoryModal.tsx     # Tạo/sửa category
│   └── TagInput.tsx              # Tag input component cho post
├── hooks/
│   ├── useBlogPosts.ts           # usePostList, usePost, useCreatePost, useUpdatePost,
│   │                             # useDeletePost, usePublishPost, useUnpublishPost
│   └── useBlogCategories.ts      # useCategoryList, useCreateCategory, useUpdateCategory, useDeleteCategory
├── services/
│   └── blog.service.ts
├── types/
│   └── index.ts                  # BlogPost, BlogCategory, BlogStatus ('draft'|'published')
└── index.ts
```

## Routes
| Route | Component | Layout |
|---|---|---|
| `/blog` | `BlogPage` | `MainLayout` (sidebar) |
| `/blog/new` | `BlogPostEditorPage` | Full-screen (no sidebar) |
| `/blog/:id/edit` | `BlogPostEditorPage` | Full-screen (no sidebar) |

Dùng `blogEditPath(id)` từ `@config/routes` để build edit URL.

## API Endpoints

### Posts
| Method | Path | Hook |
|---|---|---|
| GET | `/admin/blog/posts` | `usePostList` (paginate) |
| POST | `/admin/blog/posts` | `useCreatePost` |
| GET | `/admin/blog/posts/:id` | `usePost` |
| PATCH | `/admin/blog/posts/:id` | `useUpdatePost` |
| DELETE | `/admin/blog/posts/:id` | `useDeletePost` |
| POST | `/admin/blog/posts/:id/publish` | `usePublishPost` |
| POST | `/admin/blog/posts/:id/unpublish` | `useUnpublishPost` |

### Categories
| Method | Path | Hook |
|---|---|---|
| GET | `/admin/blog/categories` | `useCategoryList` |
| POST | `/admin/blog/categories` | `useCreateCategory` |
| PATCH | `/admin/blog/categories/:id` | `useUpdateCategory` |
| DELETE | `/admin/blog/categories/:id` | `useDeleteCategory` |

## Query Keys
`QUERY_KEYS.BLOG.POSTS`, `QUERY_KEYS.BLOG.POST`, `QUERY_KEYS.BLOG.CATEGORIES`

## Gotchas
- `BlogPostEditorPage` dùng `useParams()` để detect create vs edit mode (`id` param)
- Editor là `@uiw/react-md-editor` — dark/light mode aware
- MediaPicker từ `@modules/media` được tích hợp vào editor để chọn ảnh thumbnail
