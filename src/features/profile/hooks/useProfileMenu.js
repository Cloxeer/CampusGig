import { useState, useEffect, useRef, useCallback } from "react";

const PROFILE_MENU_EXIT_FALLBACK_MS = 520;

export function useProfileMenu() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileMenuShow, setProfileMenuShow] = useState(false);
  const [profileMenuLeave, setProfileMenuLeave] = useState(false);
  const profileMenuRef = useRef(null);
  const profileMenuExitTimerRef = useRef(null);

  const finishProfileMenuExit = useCallback(() => {
    if (profileMenuExitTimerRef.current) {
      clearTimeout(profileMenuExitTimerRef.current);
      profileMenuExitTimerRef.current = null;
    }
    setProfileMenuShow(false);
    setProfileMenuLeave(false);
  }, []);

  useEffect(() => {
    if (!profileMenuOpen && profileMenuShow && !profileMenuLeave) {
      setProfileMenuLeave(true);
    }
  }, [profileMenuOpen, profileMenuShow, profileMenuLeave]);

  useEffect(() => {
    if (!profileMenuLeave) return;
    profileMenuExitTimerRef.current = setTimeout(finishProfileMenuExit, PROFILE_MENU_EXIT_FALLBACK_MS);
    return () => {
      if (profileMenuExitTimerRef.current) {
        clearTimeout(profileMenuExitTimerRef.current);
        profileMenuExitTimerRef.current = null;
      }
    };
  }, [profileMenuLeave, finishProfileMenuExit]);

  function handleProfileMenuAnimationEnd(e) {
    if (e.target !== e.currentTarget) return;
    if (!profileMenuLeave) return;
    const name = e.animationName || "";
    if (name.includes("EaseIn") || name.includes("InReduced")) return;
    finishProfileMenuExit();
  }

  useEffect(() => {
    if (!profileMenuOpen) return;
    function closeOnOutside(ev) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(ev.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
    };
  }, [profileMenuOpen]);

  function toggleProfileMenu() {
    setProfileMenuOpen((o) => {
      const next = !o;
      if (next) {
        setProfileMenuShow(true);
        setProfileMenuLeave(false);
      }
      return next;
    });
  }

  return {
    profileMenuRef,
    profileMenuOpen,
    setProfileMenuOpen,
    profileMenuShow,
    profileMenuLeave,
    handleProfileMenuAnimationEnd,
    toggleProfileMenu,
  };
}
