import { useRef, useState, useEffect } from "react";
import {
  DocumentData,
  collection,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { get, remove } from "../lib/localStorage.ts";
import { haversineDistance, latitude, longitude } from "../lib/location";
import { db } from "../lib/firebase";
import "./Feed.css";
import close from "../assets/icons/close.svg";

interface Data {
  id: string;
  data: DocumentData;
}

interface PropPopup {
  title: string;
  content: string;
  style: string;
}

function Feed() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<Data[]>([]);

  function openModal() {
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleOutsideClick(event: MouseEvent) {
    if (modalRef.current && event.target === modalRef.current) {
      closeModal();
    }
  }

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const postsCollection = collection(db, "posts");

    return onSnapshot(postsCollection, (querySnapshot) => {
      const postData: Data[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }));

      setPosts(postData);
    });
  }, []);

  const postList = posts
    .filter(
      (post) =>
        haversineDistance(
          latitude,
          longitude,
          post.data.location.latitude,
          post.data.location.longitude,
        ) < 10,
    )
    .sort((a, b) => b.data.time - a.data.time);

  if (postList.length === 0) {
    return (
      <>
        {isModalOpen && (
          <div className="popup" ref={modalRef}>
            <div className="popup-content">
              <div className="sketch-posts-system">
                <h2 className="post-title">There are no posts near you</h2>
                <div className="post-text">
                  Be the first to post something for others to see
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="sketch-posts-system" onClick={openModal} ref={modalRef}>
          <h2 className="post-title">There are no posts near you</h2>
          <div className="post-text">
            Be the first to post something for others to see
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {postList.map((post) => (
        <Posts key={post.id} post={post} />
      ))}
    </>
  );
}

function Posts({ post: { id, data } }: { post: Data }) {
  const { title, content } = data;

  function Popup({ title, content, style }: PropPopup) {
    return (
      <div className="popup" ref={modalRef}>
        <div className="popup-content">
          <div className={style}>
            <h2 className="post-title">{title}</h2>
            <div className="post-text">{content}</div>
          </div>
        </div>
      </div>
    );
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleOutsideClick = (event: MouseEvent) => {
    if (modalRef.current && event.target === modalRef.current) {
      closeModal();
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const myPosts = get();

  async function deletePost(id: string) {
    await deleteDoc(doc(db, "posts", id));
    remove(id);
  }

  if (myPosts.indexOf(id) === -1) {
    return (
      <>
        {isModalOpen && (
          <Popup title={title} content={content} style="sketch-posts-public" />
        )}
        <div
          className="sketch-posts-public"
          key={id}
          ref={modalRef}
          onClick={openModal}
        >
          <h2 className="post-title">{title}</h2>
          <div className="post-text">{content}</div>
        </div>
      </>
    );
  }

  return (
    <>
      {isModalOpen && (
        <Popup title={title} content={data.content} style="sketch-posts-user" />
      )}
      <div
        className="sketch-posts-user"
        key={id}
        ref={modalRef}
        onClick={openModal}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            deletePost(id);
          }}
          className="buttons"
        >
          <img src={close} alt="close" className="img" />
        </button>
        <h2 className="post-title">{title}</h2>
        <div className="post-text">{content}</div>
      </div>
    </>
  );
}

export default Feed;
