import React, { FC, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { navigations } from "./navigation.data";
import { Link } from "@mui/material";
import { useLocation } from "react-router-dom";
import { ethers } from 'ethers';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LogoutIcon from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { NavigationData, NetworkInfo } from "@/types/types";


const Navigation: FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum?.selectedAddress) {
        setWalletAddress(window.ethereum.selectedAddress);
        await fetchWalletData(window.ethereum.selectedAddress);
      }
    };

    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      setNetwork({
        id: newChainId,
        name: `Unknown Network (${newChainId})`
      });
      if (walletAddress) {
        fetchWalletData(walletAddress);
      }
    };

    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [walletAddress]);

  const fetchWalletData = async (address: string) => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const balance = await provider.getBalance(address);
      setBalance(ethers.formatEther(balance).substring(0, 6));
            
      const network = await provider.getNetwork();
      setNetwork({
        id: Number(network.chainId),
        name: network.name
      });
      
      setError(null);
    } catch (err) {
      console.error("Error fetching wallet data:", err);
      setError("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to continue");
      }

      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        await fetchWalletData(accounts[0]);
                
        window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
          if (newAccounts.length > 0) {
            setWalletAddress(newAccounts[0]);
            fetchWalletData(newAccounts[0]);
          } else {
            handleDisconnect();
          }
        });

        window.ethereum.on('chainChanged', (chainId: string) => {
          const newChainId = parseInt(chainId, 16);
          setNetwork({
            id: newChainId,
            name: `Unknown Network (${newChainId})`
          });
        });
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    
    setWalletAddress(null);
    setBalance(null);
    setNetwork(null);
    handleClose();
        
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }    
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (walletAddress) {
      setAnchorEl(event.currentTarget);
    } else {
      connectWallet();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexFlow: "wrap",
        justifyContent: "end",
        flexDirection: { xs: "column", lg: "row" },
        alignItems: "center",
        gap: 2
      }}
    >
      {navigations.map(({ path: destination, label }: NavigationData) =>
        <Box
          key={label}
          component={Link}
          href={destination}
          sx={{
            display: "inline-flex",
            position: "relative",
            color: currentPath === destination ? "" : "white",
            lineHeight: "30px",
            letterSpacing: "3px",
            cursor: "pointer",
            textDecoration: "none",
            textTransform: "uppercase",
            fontWeight: 700,
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 0, lg: 3 },
            mb: { xs: 3, lg: 0 },
            fontSize: "20px",
            ...destination === "/" && { color: "primary.main" },
            "& > div": { display: "none" },
            "&.current>div": { display: "block" },
            "&:hover": {
              color: "text.disabled"
            }
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 12,
              transform: "rotate(3deg)",
              "& img": { width: 44, height: "auto" }
            }}
          >
            <img src="/images/headline-curve.svg" alt="Headline curve" />
          </Box>
          {label}
        </Box>
      )}

      {loading ? (
        <CircularProgress size={24} sx={{ color: '#00dbe3' }} />
      ) : walletAddress ? (
        <>
          <Tooltip title="Account menu">
            <Box
              onClick={handleClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                p: 1.5,
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.12)'
                }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Typography variant="body2" sx={{ color: 'white', lineHeight: 1.2 }}>
                  {balance} ETH
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.2 }}>
                  {network?.name}
                </Typography>
              </Box>
              
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  bgcolor: '#00dbe3',
                  color: 'white',
                  fontSize: '0.8rem'
                }}
              >
                {walletAddress.substring(2, 4)}
              </Avatar>
            </Box>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                minWidth: 280,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem sx={{ pointerEvents: 'none', opacity: 1 }}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {network?.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {balance} ETH
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={copyToClipboard}>
              <ListItemIcon>
                <ContentCopyIcon fontSize="small" />
              </ListItemIcon>
              {copied ? 'Copied!' : 'Copy Address'}
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                {shortenAddress(walletAddress)}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDisconnect}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Disconnect Wallet
            </MenuItem>
          </Menu>
        </>
      ) : (
        <Box
          onClick={connectWallet}
          sx={{
            color: "white",
            cursor: "pointer",
            textDecoration: "none",
            textTransform: "uppercase",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            py: 1.5,
            borderRadius: "6px",
            backgroundColor: "#00dbe3",
            '&:hover': {
              backgroundColor: "#00c4cb"
            },
            transition: 'all 0.2s ease'
          }}
        >
          Connect Wallet
        </Box>
      )}

      {error && (
        <Box sx={{ color: "error.main", mt: 1 }}>
          {error}
        </Box>
      )}
    </Box>
  );
};

export default Navigation;